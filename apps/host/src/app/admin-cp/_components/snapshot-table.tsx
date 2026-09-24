import Link from 'next/link';
import { cn } from '@devquake/ui';
import { ADMIN_BASE } from '@/lib/auth/admin';
import type { SnapshotRow } from '@/lib/admin/users';
import { Panel, formatDateTime, linkClass } from './ui';

const OUTCOME_LABELS: Record<string, string> = {
  ok: 'Success',
  code_sent: 'Code sent',
  bad_password: 'Wrong password',
  unknown_email: 'Unknown email',
  locked: 'Locked',
  throttled: 'Throttled',
  disabled: 'Disabled account',
  not_admin: 'Not an admin',
  wrong_code: 'Wrong code',
  exhausted: 'Too many wrong codes',
  exists: 'Email already registered',
  activation_sent: 'Activation link sent',
  not_activated: 'Not activated yet',
  activation_expired: 'Expired activation link',
  activation_invalid: 'Invalid activation link',
  activation_already: 'Already active',
};

const NEUTRAL = new Set(['ok', 'code_sent', 'activation_sent', 'activation_already']);
const failed = (outcome: string) => !NEUTRAL.has(outcome);

/** Sign-up / sign-in snapshots: when, where from (incl. VPN), which browser, outcome. */
export function SnapshotTable({
  rows,
  showEmail = false,
}: {
  rows: SnapshotRow[];
  showEmail?: boolean;
}) {
  return (
    <Panel className="overflow-x-auto p-0">
      <table className="w-full min-w-[960px] text-sm">
        <thead className="border-b border-ink/10 text-left text-xs text-ink/60 dark:border-paper/10 dark:text-paper/60">
          <tr>
            <th className="px-4 py-2 font-medium">Time</th>
            {showEmail && <th className="px-4 py-2 font-medium">Account</th>}
            <th className="px-4 py-2 font-medium">Step</th>
            <th className="px-4 py-2 font-medium">Result</th>
            <th className="px-4 py-2 font-medium">IP / location</th>
            <th className="px-4 py-2 font-medium">Network</th>
            <th className="px-4 py-2 font-medium">Browser / device</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5 dark:divide-paper/10">
          {rows.map((s) => (
            <tr key={s.id} className="align-top">
              <td className="px-4 py-2 text-xs whitespace-nowrap text-ink/60 tabular-nums dark:text-paper/60">
                {formatDateTime(s.occurred_at)}
              </td>
              {showEmail && (
                <td className="px-4 py-2 text-xs">
                  {s.user_id ? (
                    <Link href={`${ADMIN_BASE}/users/${s.user_id}`} className={linkClass}>
                      {s.email}
                    </Link>
                  ) : (
                    s.email
                  )}
                </td>
              )}
              <td className="px-4 py-2 text-xs">
                {s.event}
                {s.context === 'admin-cp' && (
                  <span className="ml-1 rounded bg-ink/10 px-1 text-[10px] dark:bg-paper/15">
                    CP
                  </span>
                )}
              </td>
              <td
                className={cn(
                  'px-4 py-2 text-xs',
                  failed(s.outcome) && 'font-semibold text-red-700 dark:text-red-400',
                )}
              >
                {OUTCOME_LABELS[s.outcome] ?? s.outcome}
              </td>
              <td className="px-4 py-2 text-xs">
                <span className="font-mono">{s.ip ?? '—'}</span>
                <br />
                <span className="text-ink/70 dark:text-paper/70">
                  {[s.city, s.region, s.country].filter(Boolean).join(', ') || 'Unknown location'}
                </span>
              </td>
              <td className="px-4 py-2 text-xs">
                {s.is_proxy ? (
                  <span className="font-semibold">
                    {s.proxy_type ?? 'Proxy'}
                    {s.vpn_operator && ` · ${s.vpn_operator}`}
                    <br />
                    <span className="font-normal text-ink/70 dark:text-paper/70">
                      exit in {s.country ?? 'unknown'}
                    </span>
                  </span>
                ) : (
                  <span className="text-ink/70 dark:text-paper/70">{s.isp ?? '—'}</span>
                )}
                {s.timezone_mismatch === 1 && (
                  <p className="text-amber-800 dark:text-amber-300">
                    Browser time zone {s.client_timezone} ≠ IP {s.ip_timezone}
                  </p>
                )}
              </td>
              <td className="px-4 py-2 text-xs text-ink/70 dark:text-paper/70">
                {[s.browser && `${s.browser} ${s.browser_version ?? ''}`.trim(), s.os]
                  .filter(Boolean)
                  .join(' · ') || '—'}
                {(s.device_type || s.screen) && (
                  <>
                    <br />
                    {[s.device_type, s.screen].filter(Boolean).join(' · ')}
                  </>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={showEmail ? 7 : 6}
                className="px-4 py-6 text-center text-ink/60 dark:text-paper/60"
              >
                No sign-in activity recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Panel>
  );
}
