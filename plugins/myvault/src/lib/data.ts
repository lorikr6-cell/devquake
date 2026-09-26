import type { PluginDatabase, PluginPeople, PluginUser } from '@devquake/plugin-sdk';
import { keyCheck } from './crypto';
import { HttpError } from './http';
import {
  LOCK_HOURS,
  MAX_FAILED_ATTEMPTS,
  answersSecret,
  parseVaultKey,
  type Question,
  type QuestionType,
} from './model';
import { answersMatch, hashAnswers, newSalt, seal, unseal } from './server-crypto';
import { normalizedAnswers, type ReleaseInput, type SealedInput } from './validate';

/**
 * Data access for the vault, on its OWN database (ADR 0007). Rules: an entry is visible to its
 * owner, and to its recipients only once it has been released. Opening always goes through
 * `attempt` (counted, locked after 3 failures for 36 hours).
 */

export { HttpError };

type Db = Omit<PluginDatabase, 'transaction'>;
const iso = (v: Date | string | null) => (v === null ? null : new Date(v).toISOString());

/** Remembers that the person used the vault (fallback for the inactivity rule). */
export async function recordActivity(db: Db, userId: number) {
  await db.execute(
    `INSERT INTO activity (user_id, last_seen_at) VALUES (?, UTC_TIMESTAMP())
       ON DUPLICATE KEY UPDATE last_seen_at = UTC_TIMESTAMP()`,
    [userId],
  );
}

export interface EntrySummary {
  id: number;
  title: string;
  category: string;
  ownerName: string;
  createdAt: string;
  recipients: string[];
  /** The recipients with their ids (for the owner). */
  recipientList: { id: number; name: string }[];
  inactiveDays: number | null;
  notBefore: string | null;
  releasedAt: string | null;
  lockedUntil: string | null;
  failedAttempts: number;
  attempts: number;
}

interface EntryRow {
  id: number;
  title: string;
  category: string;
  owner_name: string;
  created_at: Date;
  inactive_days: number | null;
  not_before: string | null;
  released_at: Date | null;
  locked_until: Date | null;
  failed_attempts: number;
  attempts: number | string;
  recipients: string | null;
  recipient_ids: string | null;
}

const SUMMARY = `e.id, e.title, e.category, e.owner_name, e.created_at, e.inactive_days,
  DATE_FORMAT(e.not_before, '%Y-%m-%d') AS not_before, e.released_at, e.locked_until,
  e.failed_attempts,
  (SELECT COUNT(*) FROM attempts a WHERE a.entry_id = e.id) AS attempts,
  (SELECT GROUP_CONCAT(r.display_name ORDER BY r.display_name SEPARATOR '\\n')
     FROM entry_recipients r WHERE r.entry_id = e.id) AS recipients,
  (SELECT GROUP_CONCAT(r.user_id ORDER BY r.display_name SEPARATOR ',')
     FROM entry_recipients r WHERE r.entry_id = e.id) AS recipient_ids`;

function toSummary(r: EntryRow): EntrySummary {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    ownerName: r.owner_name,
    createdAt: iso(r.created_at)!,
    recipients: r.recipients ? r.recipients.split('\n') : [],
    recipientList: r.recipient_ids
      ? r.recipient_ids.split(',').map((rid, i) => ({
          id: Number(rid),
          name: (r.recipients ?? '').split(String.fromCharCode(10))[i] ?? '',
        }))
      : [],
    inactiveDays: r.inactive_days === null ? null : Number(r.inactive_days),
    notBefore: r.not_before,
    releasedAt: iso(r.released_at),
    lockedUntil:
      r.locked_until && new Date(r.locked_until) > new Date() ? iso(r.locked_until) : null,
    failedAttempts: Number(r.failed_attempts),
    attempts: Number(r.attempts),
  };
}

/** The person's own entries, newest first. */
export async function ownEntries(db: Db, userId: number): Promise<EntrySummary[]> {
  const rows = await db.query<EntryRow>(
    `SELECT ${SUMMARY} FROM entries e WHERE e.owner_user_id = ? ORDER BY e.created_at DESC, e.id DESC`,
    [userId],
  );
  return rows.map(toSummary);
}

/** Entries released to the person (they are a recipient). */
export async function sharedWithMe(db: Db, userId: number): Promise<EntrySummary[]> {
  const rows = await db.query<EntryRow>(
    `SELECT ${SUMMARY} FROM entries e JOIN entry_recipients me ON me.entry_id = e.id AND me.user_id = ?
      WHERE e.released_at IS NOT NULL ORDER BY e.released_at DESC`,
    [userId],
  );
  return rows.map(toSummary);
}

async function questionsOf(db: Db, entryId: number): Promise<Question[]> {
  const rows = await db.query<{ prompt: string; type: QuestionType; options: string | null }>(
    'SELECT prompt, type, options FROM entry_questions WHERE entry_id = ? ORDER BY position',
    [entryId],
  );
  return rows.map((r) => ({
    prompt: r.prompt,
    type: r.type,
    options: r.options ? (JSON.parse(r.options) as string[]) : null,
  }));
}

export interface EntryAccess {
  entry: EntrySummary;
  ownerId: number;
  isOwner: boolean;
  questions: Question[];
}

/** An entry the person may open: their own, or one released to them. 404 otherwise. */
export async function entryForOpening(
  db: Db,
  entryId: number,
  userId: number,
): Promise<EntryAccess> {
  const [row] = await db.query<EntryRow & { owner_user_id: number; recipient: number | null }>(
    `SELECT ${SUMMARY}, e.owner_user_id,
            (SELECT 1 FROM entry_recipients r WHERE r.entry_id = e.id AND r.user_id = ?) AS recipient
       FROM entries e WHERE e.id = ?`,
    [userId, entryId],
  );
  if (!row) throw new HttpError(404, 'entryNotFound');
  const isOwner = Number(row.owner_user_id) === userId;
  if (!isOwner && !(row.recipient && row.released_at)) throw new HttpError(404, 'entryNotFound');
  return {
    entry: toSummary(row),
    ownerId: Number(row.owner_user_id),
    isOwner,
    questions: await questionsOf(db, entryId),
  };
}

export async function requireOwnEntry(
  db: Db,
  entryId: number,
  userId: number,
): Promise<EntryAccess> {
  const access = await entryForOpening(db, entryId, userId);
  if (!access.isOwner) throw new HttpError(404, 'entryNotFound');
  return access;
}

export interface CreateInput {
  title: string;
  category: string;
  questions: Question[];
  answers: unknown;
  keyCheck: string;
  sealed: SealedInput;
}

/** Stores a new entry (encrypted in the browser); the answers are only hashed. */
export async function createEntry(db: PluginDatabase, user: PluginUser, input: CreateInput) {
  const answers = normalizedAnswers(input.questions, input.answers);
  if (!answers) throw new HttpError(400, 'answersInvalid');
  const salt = newSalt();
  const hash = await hashAnswers(answersSecret(answers), salt);
  return db.transaction(async (tx) => {
    const { insertId } = await tx.execute(
      `INSERT INTO entries (owner_user_id, owner_name, title, category, kdf_salt, iv, ciphertext,
                            content_bytes, key_check, answers_salt, answers_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.displayName,
        input.title,
        input.category,
        input.sealed.salt,
        input.sealed.iv,
        input.sealed.ciphertext,
        input.sealed.ciphertext.length,
        input.keyCheck,
        salt,
        hash,
      ],
    );
    for (const [i, q] of input.questions.entries()) {
      await tx.execute(
        'INSERT INTO entry_questions (entry_id, position, prompt, type, options) VALUES (?, ?, ?, ?, ?)',
        [insertId, i + 1, q.prompt, q.type, q.options ? JSON.stringify(q.options) : null],
      );
    }
    return insertId;
  });
}

export interface AttemptResult {
  salt: string;
  iv: string;
  ciphertext: string;
}

/**
 * A try to open an entry with the vault key and the three answers. Every try is logged (the
 * answers of failed ones sealed, for the owner). Three failures in a row lock the entry for
 * 36 hours (or until the owner unlocks it); a success resets the count.
 */
export async function attempt(
  db: Db,
  entryId: number,
  user: PluginUser,
  keyText: unknown,
  rawAnswers: unknown,
): Promise<AttemptResult> {
  const access = await entryForOpening(db, entryId, user.id);
  const [row] = await db.query<{
    key_check: string;
    answers_salt: Buffer;
    answers_hash: Buffer;
    kdf_salt: Buffer;
    iv: Buffer;
    ciphertext: Buffer;
    failed_attempts: number;
    locked: number;
  }>(
    `SELECT key_check, answers_salt, answers_hash, kdf_salt, iv, ciphertext, failed_attempts,
            (locked_until IS NOT NULL AND locked_until > UTC_TIMESTAMP()) AS locked
       FROM entries WHERE id = ?`,
    [entryId],
  );
  if (!row) throw new HttpError(404, 'entryNotFound');
  if (Number(row.locked) === 1) throw new HttpError(423, 'locked', { hours: LOCK_HOURS });

  const keyBytes = typeof keyText === 'string' ? parseVaultKey(keyText) : null;
  const keyOk = keyBytes !== null && (await keyCheck(keyBytes)) === row.key_check;
  const answers = normalizedAnswers(access.questions, rawAnswers);
  const answersOk =
    answers !== null &&
    (await answersMatch(answersSecret(answers), row.answers_salt, row.answers_hash));
  const ok = keyOk && answersOk;

  await db.execute(
    `INSERT INTO attempts (entry_id, user_id, user_name, key_ok, ok, answers_sealed)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      entryId,
      user.id,
      user.displayName,
      keyOk ? 1 : 0,
      ok ? 1 : 0,
      ok ? null : seal(new TextEncoder().encode(JSON.stringify(rawAnswers ?? null).slice(0, 1500))),
    ],
  );
  if (ok) {
    await db.execute('UPDATE entries SET failed_attempts = 0, locked_until = NULL WHERE id = ?', [
      entryId,
    ]);
    return {
      salt: row.kdf_salt.toString('base64'),
      iv: row.iv.toString('base64'),
      ciphertext: row.ciphertext.toString('base64'),
    };
  }
  // An earlier lock that has run out starts a new count.
  const failed =
    Number(row.failed_attempts) >= MAX_FAILED_ATTEMPTS ? 1 : Number(row.failed_attempts) + 1;
  await db.execute(
    `UPDATE entries SET failed_attempts = ?,
            locked_until = IF(? >= ?, UTC_TIMESTAMP() + INTERVAL ${LOCK_HOURS} HOUR, NULL),
            lock_notify = IF(? >= ?, 1, lock_notify)
      WHERE id = ?`,
    [failed, failed, MAX_FAILED_ATTEMPTS, failed, MAX_FAILED_ATTEMPTS, entryId],
  );
  if (failed >= MAX_FAILED_ATTEMPTS) throw new HttpError(423, 'lockedNow', { hours: LOCK_HOURS });
  throw new HttpError(403, 'wrongKeyOrAnswers', { left: MAX_FAILED_ATTEMPTS - failed });
}

/** The owner unlocks an entry early (after reviewing the tries). */
export async function unlockEntry(db: Db, entryId: number, userId: number) {
  await requireOwnEntry(db, entryId, userId);
  await db.execute('UPDATE entries SET failed_attempts = 0, locked_until = NULL WHERE id = ?', [
    entryId,
  ]);
}

export interface AttemptView {
  id: number;
  userName: string | null;
  isOwner: boolean;
  keyOk: boolean;
  ok: boolean;
  /** The answers given in a failed try, as typed (option indexes for choices). */
  answers: unknown[] | null;
  at: string;
}

/** Every try on the owner's entry, newest first (failed tries with their answers). */
export async function attemptsFor(db: Db, entryId: number, userId: number) {
  const access = await requireOwnEntry(db, entryId, userId);
  const rows = await db.query<{
    id: number;
    user_id: number | null;
    user_name: string | null;
    key_ok: number;
    ok: number;
    answers_sealed: Buffer | null;
    created_at: Date;
  }>(
    `SELECT id, user_id, user_name, key_ok, ok, answers_sealed, created_at FROM attempts
      WHERE entry_id = ? ORDER BY id DESC LIMIT 200`,
    [entryId],
  );
  const attempts: AttemptView[] = rows.map((r) => {
    let answers: unknown[] | null = null;
    if (r.answers_sealed) {
      try {
        const parsed: unknown = JSON.parse(new TextDecoder().decode(unseal(r.answers_sealed)));
        answers = Array.isArray(parsed) ? parsed : null;
      } catch {
        answers = null;
      }
    }
    return {
      id: Number(r.id),
      userName: r.user_name,
      isOwner: r.user_id === userId,
      keyOk: Number(r.key_ok) === 1,
      ok: Number(r.ok) === 1,
      answers,
      at: iso(r.created_at)!,
    };
  });
  return { questions: access.questions, attempts };
}

/** The owner replaces the content (re-encrypted in the browser with the same key and answers). */
export async function replaceContent(
  db: Db,
  entryId: number,
  user: PluginUser,
  keyText: unknown,
  rawAnswers: unknown,
  sealed: SealedInput,
) {
  await requireOwnEntry(db, entryId, user.id);
  await attempt(db, entryId, user, keyText, rawAnswers);
  await db.execute(
    'UPDATE entries SET kdf_salt = ?, iv = ?, ciphertext = ?, content_bytes = ? WHERE id = ?',
    [sealed.salt, sealed.iv, sealed.ciphertext, sealed.ciphertext.length, entryId],
  );
}

export async function renameEntry(
  db: Db,
  entryId: number,
  userId: number,
  title: string,
  category: string,
) {
  await requireOwnEntry(db, entryId, userId);
  await db.execute('UPDATE entries SET title = ?, category = ? WHERE id = ?', [
    title,
    category,
    entryId,
  ]);
}

/**
 * Who gets the vault key and when. Recipients come from the owner's DevQuake referrals; with
 * recipients the vault key is needed once (checked, then sealed with the master key so it can
 * be sent later). No recipients: the entry is private and the server keeps no key.
 */
export async function setRelease(
  db: Db,
  entryId: number,
  user: PluginUser,
  people: PluginPeople | undefined,
  input: ReleaseInput,
  keyText: unknown,
) {
  const access = await requireOwnEntry(db, entryId, user.id);
  if (access.entry.releasedAt) throw new HttpError(409, 'alreadyReleased');
  if (input.recipients.length === 0) {
    await db.execute('DELETE FROM entry_recipients WHERE entry_id = ?', [entryId]);
    await db.execute(
      `UPDATE entries SET sealed_key = NULL, inactive_days = NULL, not_before = NULL,
              rule_set_at = NULL, warned_for = NULL WHERE id = ?`,
      [entryId],
    );
    return;
  }
  const network = (await people?.referrals()) ?? [];
  const current = access.entry.recipientList.map((r) => ({ id: r.id, displayName: r.name }));
  const chosen = input.recipients.map(
    (rid) => network.find((p) => p.id === rid) ?? current.find((p) => p.id === rid),
  );
  if (chosen.some((p) => !p)) throw new HttpError(403, 'referralOnly');
  const keyBytes = typeof keyText === 'string' ? parseVaultKey(keyText) : null;
  const [row] = await db.query<{ key_check: string }>(
    'SELECT key_check FROM entries WHERE id = ?',
    [entryId],
  );
  if (!keyBytes || (await keyCheck(keyBytes)) !== row?.key_check) {
    throw new HttpError(400, 'wrongKey');
  }
  await db.execute('DELETE FROM entry_recipients WHERE entry_id = ?', [entryId]);
  for (const person of chosen) {
    await db.execute(
      'INSERT INTO entry_recipients (entry_id, user_id, display_name) VALUES (?, ?, ?)',
      [entryId, person!.id, person!.displayName],
    );
  }
  await db.execute(
    `UPDATE entries SET sealed_key = ?, inactive_days = ?, not_before = ?,
            rule_set_at = UTC_TIMESTAMP(), warned_for = NULL WHERE id = ?`,
    [seal(keyBytes), input.inactiveDays, input.notBefore, entryId],
  );
}

export async function deleteEntry(db: Db, entryId: number, userId: number) {
  await requireOwnEntry(db, entryId, userId);
  await db.execute('DELETE FROM entries WHERE id = ?', [entryId]);
}

// ---------------------------------------------------------------------------------------------
// Release (scheduled job)

export interface PendingRelease {
  id: number;
  ownerId: number;
  ownerName: string;
  title: string;
  inactiveDays: number;
  notBefore: string | null;
  ruleSetAt: string;
  warnedFor: string | null;
  appLastSeen: string | null;
}

/** Entries with recipients that are not released yet. */
export async function pendingReleases(db: Db, limit: number): Promise<PendingRelease[]> {
  const rows = await db.query<{
    id: number;
    owner_user_id: number;
    owner_name: string;
    title: string;
    inactive_days: number;
    not_before: string | null;
    rule_set_at: Date;
    warned_for: Date | null;
    seen: Date | null;
  }>(
    `SELECT e.id, e.owner_user_id, e.owner_name, e.title, e.inactive_days,
            DATE_FORMAT(e.not_before, '%Y-%m-%d') AS not_before, e.rule_set_at, e.warned_for,
            a.last_seen_at AS seen
       FROM entries e LEFT JOIN activity a ON a.user_id = e.owner_user_id
      WHERE e.released_at IS NULL AND e.sealed_key IS NOT NULL AND e.inactive_days IS NOT NULL
      ORDER BY e.id LIMIT ${Math.max(1, Math.min(limit, 500))}`,
  );
  return rows.map((r) => ({
    id: r.id,
    ownerId: Number(r.owner_user_id),
    ownerName: r.owner_name,
    title: r.title,
    inactiveDays: Number(r.inactive_days),
    notBefore: r.not_before,
    ruleSetAt: iso(r.rule_set_at)!,
    warnedFor: iso(r.warned_for),
    appLastSeen: iso(r.seen),
  }));
}

/** Marks the owner as warned for this period of inactivity (once per period). */
export async function markWarned(db: Db, entryId: number, lastActive: string | null) {
  const { affectedRows } = await db.execute(
    'UPDATE entries SET warned_for = ? WHERE id = ? AND (warned_for IS NULL OR warned_for <> ?)',
    [
      lastActive ? new Date(lastActive) : new Date(0),
      entryId,
      lastActive ? new Date(lastActive) : new Date(0),
    ],
  );
  return affectedRows > 0;
}

/**
 * Releases an entry: marks it released first (so it happens once), then returns the vault key
 * and the recipients to email. Null when another process released it already.
 */
export async function releaseEntry(
  db: Db,
  entryId: number,
): Promise<{ key: Uint8Array; recipients: { userId: number; name: string }[] } | null> {
  const { affectedRows } = await db.execute(
    'UPDATE entries SET released_at = UTC_TIMESTAMP() WHERE id = ? AND released_at IS NULL',
    [entryId],
  );
  if (affectedRows === 0) return null;
  const [row] = await db.query<{ sealed_key: Buffer }>(
    'SELECT sealed_key FROM entries WHERE id = ?',
    [entryId],
  );
  const recipients = await db.query<{ user_id: number; display_name: string }>(
    'SELECT user_id, display_name FROM entry_recipients WHERE entry_id = ?',
    [entryId],
  );
  return {
    key: new Uint8Array(unseal(row!.sealed_key)),
    recipients: recipients.map((r) => ({ userId: Number(r.user_id), name: r.display_name })),
  };
}

export async function markNotified(db: Db, entryId: number, userId: number) {
  await db.execute(
    'UPDATE entry_recipients SET notified_at = UTC_TIMESTAMP() WHERE entry_id = ? AND user_id = ?',
    [entryId, userId],
  );
}

/** Entries that just got locked and whose owner is still to be told (taken once each). */
export async function takeLockNotices(db: Db, limit: number) {
  const rows = await db.query<{
    id: number;
    owner_user_id: number;
    title: string;
    locked_until: Date;
  }>(
    `SELECT id, owner_user_id, title, locked_until FROM entries WHERE lock_notify = 1
      ORDER BY id LIMIT ${Math.max(1, Math.min(limit, 100))}`,
  );
  const taken: { id: number; ownerId: number; title: string; lockedUntil: string }[] = [];
  for (const r of rows) {
    const { affectedRows } = await db.execute(
      'UPDATE entries SET lock_notify = 0 WHERE id = ? AND lock_notify = 1',
      [r.id],
    );
    if (affectedRows > 0) {
      taken.push({
        id: r.id,
        ownerId: Number(r.owner_user_id),
        title: r.title,
        lockedUntil: iso(r.locked_until)!,
      });
    }
  }
  return taken;
}
