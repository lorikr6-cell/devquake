import { HttpError } from './http';
import { isIsoDate } from './dates';
import { CURRENCIES } from './model';
import { guessStoreType, isStoreType } from './store-types';

/** Input validation for the API. Every function throws HttpError(400) with a readable message. */

export type Body = Record<string, unknown>;

export async function readBody(request: Request): Promise<Body> {
  const data: unknown = await request.json().catch(() => null);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new HttpError(400, 'Invalid request');
  }
  return data as Body;
}

const bad = (message: string) => new HttpError(400, message);

/** Trimmed text with whitespace collapsed; null when empty. */
export function optionalText(value: unknown, label: string, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw bad(`${label} must be text`);
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (text.length > max) throw bad(`${label} is too long (max ${max} characters)`);
  return text;
}

export function requiredText(value: unknown, label: string, max: number): string {
  const text = optionalText(value, label, max);
  if (!text) throw bad(`${label} is required`);
  return text;
}

/** Accepts numbers or strings with a comma or dot as decimal separator ("4,50"). */
function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  if (typeof value !== 'string') return value === undefined || value === null ? null : NaN;
  const text = value.trim().replace(',', '.');
  if (!text) return null;
  return /^\d+(\.\d+)?$/.test(text) ? Number(text) : NaN;
}

/** Optional quantity: empty = none (the product is just "1 × unit"). */
export function quantity(value: unknown): number | null {
  const n = toNumber(value);
  if (n === null) return null;
  if (Number.isNaN(n) || n <= 0 || n > 99_999) throw bad('Quantity must be a number above 0');
  return Math.round(n * 1000) / 1000;
}

export function price(value: unknown): number | null {
  const n = toNumber(value);
  if (n === null) return null;
  if (Number.isNaN(n) || n < 0 || n > 9_999_999) throw bad('Price must be a positive number');
  return Math.round(n * 100) / 100;
}

export function currency(value: unknown): string {
  if (value === undefined || value === null || value === '') return 'RON';
  if (typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value)) return value;
  throw bad('Unknown currency');
}

/** The day a list is planned for ("YYYY-MM-DD"). */
export function shopDate(value: unknown): string {
  if (isIsoDate(value)) return value;
  throw bad('Pick a valid date for the shopping');
}

/** A positive integer id, e.g. from a route param. */
export function id(value: unknown, label = 'id'): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || n <= 0) throw new HttpError(404, `Unknown ${label}`);
  return n;
}

/** Optional store reference: null/""/undefined = no store. */
export function storeRef(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  return id(value, 'store');
}

export interface StoreInput {
  name: string;
  type: string;
  location: string | null;
  description: string | null;
}

/** Store fields; the type is filled in from the name ("Kaufland" → grocery) when not given. */
export function storeInput(body: Body): StoreInput {
  const name = requiredText(body.name, 'Store name', 80);
  let type: string;
  if (body.type === undefined || body.type === null || body.type === '') {
    type = guessStoreType(name) ?? 'other';
  } else if (isStoreType(body.type)) {
    type = body.type;
  } else {
    throw bad('Unknown store type');
  }
  return {
    name,
    type,
    location: optionalText(body.location, 'Location', 160),
    description: optionalText(body.description, 'Store description', 255),
  };
}

export interface ItemInput {
  name: string;
  quantity: number | null;
  unit: string;
  price: number | null;
  description: string | null;
  storeId: number | null;
}

export function itemInput(body: Body): ItemInput {
  return {
    name: requiredText(body.name, 'Item name', 120),
    quantity: quantity(body.quantity),
    unit: requiredText(body.unit, 'Unit', 16),
    price: price(body.price),
    description: optionalText(body.description, 'Description', 255),
    storeId: storeRef(body.storeId),
  };
}
