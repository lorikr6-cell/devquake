import { HttpError } from './http';
import {
  MAX_CONTENT_BYTES,
  MAX_INACTIVE_DAYS,
  MIN_INACTIVE_DAYS,
  QUESTIONS_PER_ENTRY,
  QUESTION_TYPES,
  isCategory,
  normalizeAnswer,
  type Category,
  type Question,
  type QuestionType,
} from './model';

/** Input validation for the API: every function throws HttpError(400) with a translation key. */

export type Body = Record<string, unknown>;

export async function readBody(request: Request): Promise<Body> {
  const data: unknown = await request.json().catch(() => null);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new HttpError(400, 'invalidRequest');
  }
  return data as Body;
}

const bad = (key: string, params?: Record<string, string | number>) =>
  new HttpError(400, key, params);

export function text(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string') throw bad('required', { field });
  const t = value.replace(/\s+/g, ' ').trim();
  if (!t) throw bad('required', { field });
  if (t.length > max) throw bad('tooLong', { field, max });
  return t;
}

export function id(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || n <= 0) throw new HttpError(404, 'notFound');
  return n;
}

export function category(value: unknown): Category {
  if (isCategory(value)) return value;
  throw bad('invalidRequest');
}

/** Three questions: a prompt, a type, and 2–12 distinct options for single and multi. */
export function questions(value: unknown): Question[] {
  if (!Array.isArray(value) || value.length !== QUESTIONS_PER_ENTRY) throw bad('threeQuestions');
  return value.map((raw, i) => {
    const q = (raw ?? {}) as Body;
    const type = q.type as QuestionType;
    if (!QUESTION_TYPES.includes(type)) throw bad('invalidRequest');
    const prompt = text(q.prompt, 'question', 200);
    let options: string[] | null = null;
    if (type === 'single' || type === 'multi') {
      if (!Array.isArray(q.options)) throw bad('options', { n: i + 1 });
      options = q.options.map((o) => text(o, 'option', 80));
      const distinct = new Set(options.map((o) => o.toLowerCase()));
      if (options.length < 2 || options.length > 12 || distinct.size !== options.length) {
        throw bad('options', { n: i + 1 });
      }
    }
    return { prompt, type, options };
  });
}

/**
 * The answers to the questions in their canonical form, or null when one is missing or not
 * valid (a wrong try, not an input error: it is still counted).
 */
export function normalizedAnswers(qs: Question[], value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length !== qs.length) return null;
  const out: string[] = [];
  for (let i = 0; i < qs.length; i++) {
    const n = normalizeAnswer(qs[i]!, value[i]);
    if (n === null) return null;
    out.push(n);
  }
  return out;
}

/** Base64 bytes with a size limit (the encrypted content, a salt, a nonce). */
export function bytes(value: unknown, min: number, max: number, key = 'invalidRequest'): Buffer {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(value))
    throw bad('invalidRequest');
  const data = Buffer.from(value, 'base64');
  if (data.length < min) throw bad('invalidRequest');
  if (data.length > max) throw new HttpError(413, key);
  return data;
}

export interface SealedInput {
  salt: Buffer;
  iv: Buffer;
  ciphertext: Buffer;
}

export function sealedInput(body: Body): SealedInput {
  return {
    salt: bytes(body.salt, 16, 32),
    iv: bytes(body.iv, 12, 16),
    // AES-GCM adds 16 bytes; base64 content of files is inside.
    ciphertext: bytes(body.ciphertext, 17, MAX_CONTENT_BYTES + 1024, 'tooLarge'),
  };
}

export function keyCheckHex(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) throw bad('invalidRequest');
  return value;
}

export interface ReleaseInput {
  recipients: number[];
  inactiveDays: number | null;
  notBefore: string | null;
}

export function releaseInput(body: Body): ReleaseInput {
  const recipients = Array.isArray(body.recipients) ? [...new Set(body.recipients.map(id))] : [];
  if (recipients.length > 10) throw bad('tooManyRecipients', { max: 10 });
  if (recipients.length === 0) return { recipients, inactiveDays: null, notBefore: null };
  const days = Number(body.inactiveDays);
  if (!Number.isInteger(days) || days < MIN_INACTIVE_DAYS || days > MAX_INACTIVE_DAYS) {
    throw bad('inactiveDays', { min: MIN_INACTIVE_DAYS, max: MAX_INACTIVE_DAYS });
  }
  let notBefore: string | null = null;
  if (body.notBefore !== undefined && body.notBefore !== null && body.notBefore !== '') {
    if (typeof body.notBefore !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.notBefore)) {
      throw bad('date');
    }
    notBefore = body.notBefore;
  }
  return { recipients, inactiveDays: days, notBefore };
}
