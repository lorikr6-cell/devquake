import { randomInt } from 'node:crypto';
import type { PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { HttpError } from './http';
import { newInviteCode, type Item, type ListSnapshot, type Member, type Store } from './model';

/**
 * Data access for the shopping plugin, on its OWN database (ctx.db, ADR 0007). Every function
 * that touches a list first checks that the user is a member of it.
 */

export { HttpError };

type Db = Omit<PluginDatabase, 'transaction'>;

interface ListRow {
  id: number;
  name: string;
  currency: string;
  version: number;
  role: 'owner' | 'member';
}

export async function membership(db: Db, listId: number, userId: number) {
  const [row] = await db.query<ListRow>(
    `SELECT l.id, l.name, l.currency, l.version, m.role
       FROM lists l JOIN list_members m ON m.list_id = l.id
      WHERE l.id = ? AND m.user_id = ?`,
    [listId, userId],
  );
  return row ?? null;
}

export async function requireMember(db: Db, listId: number, userId: number) {
  const row = await membership(db, listId, userId);
  if (!row) throw new HttpError(404, 'List not found');
  return row;
}

export async function requireOwner(db: Db, listId: number, userId: number) {
  const row = await requireMember(db, listId, userId);
  if (row.role !== 'owner') throw new HttpError(403, 'Only the list owner can do that');
  return row;
}

/** Marks a list as changed so every open copy refreshes. */
export async function touch(db: Db, listId: number) {
  await db.execute('UPDATE lists SET version = version + 1 WHERE id = ?', [listId]);
}

/** Keeps the member's display name in sync with their DevQuake profile. */
export async function refreshMemberName(db: Db, listId: number, user: PluginUser) {
  await db.execute(
    'UPDATE list_members SET display_name = ? WHERE list_id = ? AND user_id = ? AND display_name <> ?',
    [user.displayName, listId, user.id, user.displayName],
  );
}

export interface ListSummary {
  id: number;
  name: string;
  role: 'owner' | 'member';
  members: number;
  open: number;
  done: number;
}

export function listsForUser(db: Db, userId: number) {
  return db.query<ListSummary>(
    `SELECT l.id, l.name, m.role,
            (SELECT COUNT(*) FROM list_members x WHERE x.list_id = l.id) AS members,
            (SELECT COUNT(*) FROM items i WHERE i.list_id = l.id AND i.done_at IS NULL) AS open,
            (SELECT COUNT(*) FROM items i WHERE i.list_id = l.id AND i.done_at IS NOT NULL) AS done
       FROM lists l JOIN list_members m ON m.list_id = l.id
      WHERE m.user_id = ?
      ORDER BY l.updated_at DESC`,
    [userId],
  );
}

interface ItemRow {
  id: number;
  store_id: number | null;
  name: string;
  quantity: string | number;
  unit: string | null;
  price: string | number | null;
  description: string | null;
  added_by_name: string | null;
  done_at: Date | null;
  done_by_name: string | null;
}

function toItem(r: ItemRow): Item {
  return {
    id: r.id,
    storeId: r.store_id,
    name: r.name,
    quantity: Number(r.quantity),
    unit: r.unit,
    price: r.price === null ? null : Number(r.price),
    description: r.description,
    addedByName: r.added_by_name,
    done: r.done_at !== null,
    doneByName: r.done_by_name,
  };
}

export async function snapshot(db: Db, listId: number, userId: number): Promise<ListSnapshot> {
  const list = await requireMember(db, listId, userId);
  const [members, stores, items] = await Promise.all([
    db.query<{ user_id: number; display_name: string; role: Member['role'] }>(
      `SELECT user_id, display_name, role FROM list_members WHERE list_id = ?
        ORDER BY role = 'owner' DESC, joined_at`,
      [listId],
    ),
    db.query<Store>(
      'SELECT id, name, type, location, description FROM stores WHERE list_id = ? ORDER BY name, id',
      [listId],
    ),
    db.query<ItemRow>(
      `SELECT id, store_id, name, quantity, unit, price, description, added_by_name, done_at, done_by_name
         FROM items WHERE list_id = ? ORDER BY position, id`,
      [listId],
    ),
  ]);
  return {
    id: list.id,
    name: list.name,
    currency: list.currency,
    version: Number(list.version),
    role: list.role,
    members: members.map((m) => ({ userId: m.user_id, displayName: m.display_name, role: m.role })),
    stores,
    items: items.map(toItem),
  };
}

export async function createList(
  db: PluginDatabase,
  user: PluginUser,
  name: string,
  currency: string,
) {
  return db.transaction(async (tx) => {
    const { insertId } = await tx.execute(
      'INSERT INTO lists (name, currency, owner_user_id) VALUES (?, ?, ?)',
      [name, currency, user.id],
    );
    await tx.execute(
      "INSERT INTO list_members (list_id, user_id, role, display_name) VALUES (?, ?, 'owner', ?)",
      [insertId, user.id, user.displayName],
    );
    return insertId;
  });
}

/** The list's active invite code, creating one if needed. */
export async function activeInvite(db: Db, listId: number, createdBy: number): Promise<string> {
  const [existing] = await db.query<{ code: string }>(
    'SELECT code FROM list_invites WHERE list_id = ? AND revoked_at IS NULL ORDER BY id DESC LIMIT 1',
    [listId],
  );
  if (existing) return existing.code;
  return rotateInvite(db, listId, createdBy);
}

/** Revokes every code of the list and issues a new one (old links stop working). */
export async function rotateInvite(db: Db, listId: number, createdBy: number): Promise<string> {
  await db.execute(
    'UPDATE list_invites SET revoked_at = UTC_TIMESTAMP() WHERE list_id = ? AND revoked_at IS NULL',
    [listId],
  );
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newInviteCode(randomInt);
    try {
      await db.execute('INSERT INTO list_invites (list_id, code, created_by) VALUES (?, ?, ?)', [
        listId,
        code,
        createdBy,
      ]);
      return code;
    } catch (err) {
      if ((err as { code?: string }).code !== 'ER_DUP_ENTRY') throw err;
    }
  }
  throw new Error('Could not create an invite code');
}

export async function listByInvite(db: Db, code: string) {
  const [row] = await db.query<{ id: number; name: string; owner: string; members: number }>(
    `SELECT l.id, l.name,
            (SELECT display_name FROM list_members WHERE list_id = l.id AND role = 'owner' LIMIT 1) AS owner,
            (SELECT COUNT(*) FROM list_members WHERE list_id = l.id) AS members
       FROM list_invites i JOIN lists l ON l.id = i.list_id
      WHERE i.code = ? AND i.revoked_at IS NULL`,
    [code],
  );
  return row ?? null;
}

/** Joins the list behind an invite code; returns its id. Joining twice is harmless. */
export async function joinByInvite(db: Db, code: string, user: PluginUser): Promise<number> {
  const list = await listByInvite(db, code);
  if (!list) throw new HttpError(404, 'This invitation is no longer valid');
  const result = await db.execute(
    "INSERT IGNORE INTO list_members (list_id, user_id, role, display_name) VALUES (?, ?, 'member', ?)",
    [list.id, user.id, user.displayName],
  );
  if (result.affectedRows > 0) await touch(db, list.id);
  return list.id;
}
