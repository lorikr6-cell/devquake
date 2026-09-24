import type { PluginDatabase, PluginPeople, PluginUser } from '@devquake/plugin-sdk';
import { requireMember, requireOwner, touch } from './data';
import { HttpError } from './http';
import type { ItemInput, StoreInput } from './validate';

/**
 * Changes to a list. Each one checks membership (or ownership) first and bumps the list's
 * version so other open copies refresh.
 */

type Db = Omit<PluginDatabase, 'transaction'>;

async function requireStore(db: Db, listId: number, storeId: number | null) {
  if (storeId === null) return;
  const [row] = await db.query('SELECT id FROM stores WHERE id = ? AND list_id = ?', [
    storeId,
    listId,
  ]);
  if (!row) throw new HttpError(400, 'That store is not on this list');
}

async function requireItem(db: Db, listId: number, itemId: number) {
  const [row] = await db.query('SELECT id FROM items WHERE id = ? AND list_id = ?', [
    itemId,
    listId,
  ]);
  if (!row) throw new HttpError(404, 'Item not found');
}

// --- list ---------------------------------------------------------------------------------

export async function updateList(
  db: Db,
  listId: number,
  user: PluginUser,
  changes: { name?: string; currency?: string },
) {
  await requireOwner(db, listId, user.id);
  if (changes.name !== undefined) {
    await db.execute('UPDATE lists SET name = ? WHERE id = ?', [changes.name, listId]);
  }
  if (changes.currency !== undefined) {
    await db.execute('UPDATE lists SET currency = ? WHERE id = ?', [changes.currency, listId]);
  }
  await touch(db, listId);
}

export async function deleteList(db: Db, listId: number, user: PluginUser) {
  await requireOwner(db, listId, user.id);
  // Members, invites, stores and items go with it (ON DELETE CASCADE).
  await db.execute('DELETE FROM lists WHERE id = ?', [listId]);
}

// --- items --------------------------------------------------------------------------------

export async function addItem(db: Db, listId: number, user: PluginUser, input: ItemInput) {
  await requireMember(db, listId, user.id);
  await requireStore(db, listId, input.storeId);
  const { insertId } = await db.execute(
    `INSERT INTO items (list_id, store_id, name, quantity, unit, price, description, added_by, added_by_name, position)
     SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(MAX(position), 0) + 1 FROM items WHERE list_id = ?`,
    [
      listId,
      input.storeId,
      input.name,
      input.quantity,
      input.unit,
      input.price,
      input.description,
      user.id,
      user.displayName,
      listId,
    ],
  );
  await touch(db, listId);
  return insertId;
}

export async function updateItem(
  db: Db,
  listId: number,
  itemId: number,
  user: PluginUser,
  input: Partial<ItemInput> & { done?: boolean },
) {
  await requireMember(db, listId, user.id);
  await requireItem(db, listId, itemId);
  if (input.storeId !== undefined) await requireStore(db, listId, input.storeId);

  const columns: Record<keyof ItemInput, string> = {
    name: 'name',
    quantity: 'quantity',
    unit: 'unit',
    price: 'price',
    description: 'description',
    storeId: 'store_id',
  };
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, column] of Object.entries(columns) as Array<[keyof ItemInput, string]>) {
    if (input[key] !== undefined) {
      sets.push(`${column} = ?`);
      values.push(input[key]);
    }
  }
  if (input.done === true) {
    sets.push('done_at = COALESCE(done_at, UTC_TIMESTAMP())', 'done_by = ?', 'done_by_name = ?');
    values.push(user.id, user.displayName);
  } else if (input.done === false) {
    sets.push('done_at = NULL', 'done_by = NULL', 'done_by_name = NULL');
  }
  if (sets.length === 0) return;
  await db.execute(`UPDATE items SET ${sets.join(', ')} WHERE id = ? AND list_id = ?`, [
    ...values,
    itemId,
    listId,
  ]);
  await touch(db, listId);
}

export async function deleteItem(db: Db, listId: number, itemId: number, user: PluginUser) {
  await requireMember(db, listId, user.id);
  const { affectedRows } = await db.execute('DELETE FROM items WHERE id = ? AND list_id = ?', [
    itemId,
    listId,
  ]);
  if (affectedRows > 0) await touch(db, listId);
}

export async function clearDone(db: Db, listId: number, user: PluginUser) {
  await requireMember(db, listId, user.id);
  const { affectedRows } = await db.execute(
    'DELETE FROM items WHERE list_id = ? AND done_at IS NOT NULL',
    [listId],
  );
  if (affectedRows > 0) await touch(db, listId);
  return affectedRows;
}

// --- stores -------------------------------------------------------------------------------

/** Adds a store to the list, or returns the existing one with the same name and location. */
export async function addStore(db: Db, listId: number, user: PluginUser, input: StoreInput) {
  await requireMember(db, listId, user.id);
  const [existing] = await db.query<{ id: number }>(
    'SELECT id FROM stores WHERE list_id = ? AND name = ? AND location <=> ? LIMIT 1',
    [listId, input.name, input.location],
  );
  if (existing) return existing.id;
  const { insertId } = await db.execute(
    'INSERT INTO stores (list_id, name, type, location, description) VALUES (?, ?, ?, ?, ?)',
    [listId, input.name, input.type, input.location, input.description],
  );
  await touch(db, listId);
  return insertId;
}

export async function updateStore(
  db: Db,
  listId: number,
  storeId: number,
  user: PluginUser,
  input: StoreInput,
) {
  await requireMember(db, listId, user.id);
  await requireStore(db, listId, storeId);
  await db.execute(
    'UPDATE stores SET name = ?, type = ?, location = ?, description = ? WHERE id = ? AND list_id = ?',
    [input.name, input.type, input.location, input.description, storeId, listId],
  );
  await touch(db, listId);
}

/** Removes a store; its items stay on the list without a store (ON DELETE SET NULL). */
export async function deleteStore(db: Db, listId: number, storeId: number, user: PluginUser) {
  await requireMember(db, listId, user.id);
  const { affectedRows } = await db.execute('DELETE FROM stores WHERE id = ? AND list_id = ?', [
    storeId,
    listId,
  ]);
  if (affectedRows > 0) await touch(db, listId);
}

// --- members ------------------------------------------------------------------------------

/**
 * The owner adds someone from their DevQuake referral network (ctx.people). Anyone else must
 * join through the invite link. Returns whether the person can already open the app.
 */
export async function addReferralMember(
  db: Db,
  listId: number,
  user: PluginUser,
  people: PluginPeople | undefined,
  personId: number,
) {
  await requireOwner(db, listId, user.id);
  const person = (await people?.referrals())?.find((p) => p.id === personId);
  if (!person) {
    throw new HttpError(
      403,
      'You can only add people you referred to DevQuake (or who referred you)',
    );
  }
  const { affectedRows } = await db.execute(
    "INSERT IGNORE INTO list_members (list_id, user_id, role, display_name) VALUES (?, ?, 'member', ?)",
    [listId, person.id, person.displayName],
  );
  if (affectedRows > 0) await touch(db, listId);
  return { added: affectedRows > 0, hasAccess: person.hasAccess };
}

/** The owner removes a member, or a member leaves. The owner cannot leave (delete the list). */
export async function removeMember(db: Db, listId: number, user: PluginUser, memberId: number) {
  const me = await requireMember(db, listId, user.id);
  if (memberId === user.id) {
    if (me.role === 'owner') {
      throw new HttpError(400, 'The owner cannot leave the list; delete it instead');
    }
  } else if (me.role !== 'owner') {
    throw new HttpError(403, 'Only the list owner can remove members');
  }
  const { affectedRows } = await db.execute(
    "DELETE FROM list_members WHERE list_id = ? AND user_id = ? AND role = 'member'",
    [listId, memberId],
  );
  if (affectedRows > 0) await touch(db, listId);
}
