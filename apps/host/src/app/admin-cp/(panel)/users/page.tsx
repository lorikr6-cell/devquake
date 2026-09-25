import { DateTime } from '@/components/date-time';
import Link from 'next/link';
import { Button } from '@devquake/ui';
import { ADMIN_BASE, requireOwner } from '@/lib/auth/admin';
import { listRoles, listUsers } from '@/lib/admin/users';
import { BulkRemoveForm } from '../../_components/remove-users';
import { PageHeader, Panel, inlineInputClass, linkClass } from '../../_components/ui';

export const metadata = { title: 'Users' };

type Props = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    role?: string;
    inactive?: string;
    removed?: string;
  }>;
};

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-ink/40 dark:text-paper/40">—</span>;
  return (
    <span aria-label={`${rating} of 5`} className="whitespace-nowrap">
      <span className="text-quake">{'★'.repeat(rating)}</span>
      <span className="text-ink/20 dark:text-paper/20">{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

export default async function UsersPage({ searchParams }: Props) {
  const owner = await requireOwner();
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 100) || undefined;
  const [users, roles] = await Promise.all([
    listUsers({ q, status: sp.status, role: sp.role, inactive: sp.inactive }),
    listRoles(),
  ]);

  return (
    <>
      <PageHeader title="Users" />

      <form className="mb-4 flex flex-wrap items-end gap-3" action={`${ADMIN_BASE}/users`}>
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search name or email"
          aria-label="Search"
          className={`${inlineInputClass} w-64`}
        />
        <select
          name="status"
          defaultValue={sp.status ?? ''}
          aria-label="Status"
          className={`${inlineInputClass} w-auto`}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending (email not confirmed)</option>
          <option value="disabled">Disabled</option>
        </select>
        <select
          name="role"
          defaultValue={sp.role ?? ''}
          aria-label="Role"
          className={`${inlineInputClass} w-auto`}
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          name="inactive"
          defaultValue={sp.inactive ?? ''}
          aria-label="Inactivity"
          className={`${inlineInputClass} w-auto`}
        >
          <option value="">Any activity</option>
          <option value="never">Never signed in</option>
          <option value="6m">No sign-in for 6+ months</option>
          <option value="12m">No sign-in for 12+ months</option>
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      {sp.removed ? (
        <p
          role="status"
          className="mb-3 rounded-md bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          The account was removed and the user was emailed.
        </p>
      ) : null}

      <BulkRemoveForm>
        <Panel className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-ink/10 text-left text-xs text-ink/60 dark:border-paper/10 dark:text-paper/60">
              <tr>
                <th className="w-10 px-4 py-2 font-medium">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-4 py-2 font-medium">User</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Roles</th>
                <th className="px-4 py-2 font-medium">Projects</th>
                <th className="px-4 py-2 font-medium">Rating</th>
                <th className="px-4 py-2 font-medium">NPS</th>
                <th className="px-4 py-2 font-medium">Last sign-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 dark:divide-paper/10">
              {users.map((u) => {
                const codes = u.role_codes?.split(',') ?? [];
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      {codes.includes('platform.owner') || u.id === owner.userId ? null : (
                        <input
                          type="checkbox"
                          name="ids"
                          value={u.id}
                          aria-label={`Select ${u.display_name}`}
                          className="size-4 accent-quake"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`${ADMIN_BASE}/users/${u.id}`} className={linkClass}>
                        {u.display_name}
                      </Link>
                      <p className="text-xs text-ink/60 dark:text-paper/60">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {u.status}
                      {u.locked === 1 && (
                        <span className="ml-1 font-semibold text-red-700 dark:text-red-400">
                          · locked
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {codes.includes('platform.owner')
                        ? 'Owner'
                        : codes.includes('platform.admin')
                          ? 'Admin'
                          : 'User'}
                      {codes.filter((c) => !c.startsWith('platform.')).length > 0 &&
                        ` +${codes.filter((c) => !c.startsWith('platform.')).length}`}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{u.project_count}</td>
                    <td className="px-4 py-3">
                      <Stars rating={u.rating} />
                    </td>
                    <td className="px-4 py-3 tabular-nums">{u.nps}</td>
                    <td className="px-4 py-3 text-xs text-ink/70 dark:text-paper/70">
                      <DateTime value={u.last_login_at} />
                      {u.last_country && (
                        <p>{[u.last_city, u.last_country].filter(Boolean).join(', ')}</p>
                      )}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-ink/60 dark:text-paper/60">
                    No users match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
      </BulkRemoveForm>
    </>
  );
}
