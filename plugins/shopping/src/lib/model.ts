// Plain types and pure helpers, shared by pages, client components and the API (no imports).

export interface Store {
  id: number;
  name: string;
  /** Store type code from the catalogue (store-types.ts). */
  type: string;
  location: string | null;
  description: string | null;
}

export interface Item {
  id: number;
  storeId: number | null;
  name: string;
  quantity: number;
  unit: string | null;
  /** Price per unit, or null when not priced yet. */
  price: number | null;
  description: string | null;
  addedByName: string | null;
  done: boolean;
  doneByName: string | null;
}

export interface Member {
  userId: number;
  displayName: string;
  role: 'owner' | 'member';
}

export interface ListSnapshot {
  id: number;
  name: string;
  currency: string;
  version: number;
  role: 'owner' | 'member';
  members: Member[];
  stores: Store[];
  items: Item[];
}

export const CURRENCIES = ['RON', 'EUR', 'USD', 'HUF', 'GBP'] as const;

/** price x quantity, rounded to cents; null when the item has no price. */
export function lineTotal(item: Pick<Item, 'price' | 'quantity'>): number | null {
  if (item.price === null) return null;
  return Math.round(item.price * item.quantity * 100) / 100;
}

export interface StoreGroup {
  /** null = items without a store. */
  store: Store | null;
  items: Item[];
  total: number;
  unpriced: number;
}

/**
 * Items grouped by store (stores in the list's order, "no store" last), each group with its
 * total. Open items come first, done items move to the bottom (shopping mode).
 */
export function groupByStore(stores: Store[], items: Item[]): StoreGroup[] {
  const known = new Map(stores.map((s) => [s.id, s]));
  const groups = new Map<number | null, StoreGroup>();
  for (const s of stores) groups.set(s.id, { store: s, items: [], total: 0, unpriced: 0 });
  for (const item of items) {
    const key = item.storeId !== null && known.has(item.storeId) ? item.storeId : null;
    let group = groups.get(key);
    if (!group) {
      group = { store: null, items: [], total: 0, unpriced: 0 };
      groups.set(null, group);
    }
    group.items.push(item);
    const line = lineTotal(item);
    if (line === null) group.unpriced += 1;
    else group.total = Math.round((group.total + line) * 100) / 100;
  }
  return [...groups.values()]
    .filter((g) => g.items.length > 0)
    .sort((a, b) => (a.store === null ? 1 : 0) - (b.store === null ? 1 : 0))
    .map((g) => ({
      ...g,
      items: [...g.items.filter((i) => !i.done), ...g.items.filter((i) => i.done)],
    }));
}

export interface Totals {
  total: number;
  unpriced: number;
}

export function computeTotals(items: Item[]): Totals {
  let total = 0;
  let unpriced = 0;
  for (const item of items) {
    const line = lineTotal(item);
    if (line === null) unpriced += 1;
    else total = Math.round((total + line) * 100) / 100;
  }
  return { total, unpriced };
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatQuantity(quantity: number, unit: string | null): string {
  const q = Number.isInteger(quantity) ? String(quantity) : String(Number(quantity.toFixed(3)));
  return unit ? `${q} ${unit}` : q;
}

// Invite codes: no 0/O/1/I/L, so they are easy to read out loud or type from a QR label.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_PATTERN = /^[A-HJ-KM-NP-Z2-9]{8}$/;

export function newInviteCode(random: (max: number) => number): string {
  let code = '';
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[random(CODE_ALPHABET.length)];
  return code;
}
