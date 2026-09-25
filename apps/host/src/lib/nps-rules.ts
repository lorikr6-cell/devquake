// NPS points (ADR 0012): members spend them to subscribe to apps. Pure, so it can be tested.

/** Points every new account starts with. */
export const NPS_START = 3;

/** Highest cost the owner can set for one app. */
export const NPS_COST_MAX = 1000;

/**
 * Points a subscription costs this member: the project's cost, except for admins and members
 * the owner assigned to the project, who are exempt.
 */
export function subscriptionCost(
  projectCost: number,
  who: { isAdmin: boolean; assigned: boolean },
): number {
  if (who.isAdmin || who.assigned) return 0;
  return Math.max(0, Math.floor(projectCost));
}

/** Points still missing to pay `cost` from `balance` (0 = affordable). */
export function missingPoints(balance: number, cost: number): number {
  return Math.max(0, cost - balance);
}

/** A cost typed in /admin-cp: a whole number from 0 (FREE) to NPS_COST_MAX, else null. */
export function parseNpsCost(value: unknown): number | null {
  const text = String(value ?? '').trim();
  if (!/^\d{1,4}$/.test(text)) return null;
  const n = Number(text);
  return n <= NPS_COST_MAX ? n : null;
}
