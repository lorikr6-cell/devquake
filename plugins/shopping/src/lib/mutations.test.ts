import { describe, expect, it } from 'vitest';
import type { PluginPeople, PluginUser } from '@devquake/plugin-sdk';
import { HttpError } from './http';
import { addReferralMember, removeMember } from './mutations';

// A tiny fake database: answers the membership query with the given role and records writes.
function fakeDb(role: 'owner' | 'member' | null) {
  const writes: Array<{ sql: string; params: unknown[] }> = [];
  return {
    writes,
    db: {
      async query<T>(sql: string): Promise<T[]> {
        if (sql.includes('FROM lists l JOIN list_members')) {
          return (role ? [{ id: 1, name: 'L', currency: 'RON', version: 1, role }] : []) as T[];
        }
        return [];
      },
      async execute(sql: string, params: unknown[] = []) {
        writes.push({ sql, params });
        return { affectedRows: 1, insertId: 0 };
      },
    },
  };
}

const me: PluginUser = { id: 10, displayName: 'Ana', isAdmin: false };
const people: PluginPeople = {
  referrals: async () => [
    { id: 20, displayName: 'Bogdan', relation: 'referred', hasAccess: false },
  ],
};

const statusOf = async (p: Promise<unknown>) =>
  p.then(
    () => null,
    (err) => (err instanceof HttpError ? err.status : 'other'),
  );

describe('addReferralMember', () => {
  it('adds someone from the owner referral network with their DevQuake name', async () => {
    const { db, writes } = fakeDb('owner');
    const result = await addReferralMember(db, 1, me, people, 20);
    expect(result).toEqual({ added: true, hasAccess: false });
    expect(writes[0]!.params).toEqual([1, 20, 'Bogdan']);
  });

  it('refuses people outside the referral network', async () => {
    const { db, writes } = fakeDb('owner');
    expect(await statusOf(addReferralMember(db, 1, me, people, 99))).toBe(403);
    expect(await statusOf(addReferralMember(db, 1, me, undefined, 20))).toBe(403);
    expect(writes).toHaveLength(0);
  });

  it('is only for the list owner', async () => {
    expect(await statusOf(addReferralMember(fakeDb('member').db, 1, me, people, 20))).toBe(403);
    expect(await statusOf(addReferralMember(fakeDb(null).db, 1, me, people, 20))).toBe(404);
  });
});

describe('removeMember', () => {
  it('lets a member leave but not remove others', async () => {
    expect(await statusOf(removeMember(fakeDb('member').db, 1, me, me.id))).toBeNull();
    expect(await statusOf(removeMember(fakeDb('member').db, 1, me, 20))).toBe(403);
  });

  it('does not let the owner leave their own list', async () => {
    expect(await statusOf(removeMember(fakeDb('owner').db, 1, me, me.id))).toBe(400);
    expect(await statusOf(removeMember(fakeDb('owner').db, 1, me, 20))).toBeNull();
  });
});
