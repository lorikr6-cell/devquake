import { getTimeZone } from '@/lib/timezone-server';
import { DateTime } from '@/components/date-time';
import { requireOwner } from '@/lib/auth/admin';
import {
  failureReasons,
  getDailyAuthActivity,
  getUserTotals,
  getVpnShare,
  listSnapshots,
  topBrowsers,
  topCountries,
  topFailedEmails,
} from '@/lib/admin/users';
import { DailyBars, RankedBars } from '../../_components/charts';
import { SnapshotTable } from '../../_components/snapshot-table';
import { PageHeader, Panel } from '../../_components/ui';

export const metadata = { title: 'Statistics' };

const REASONS: Record<string, string> = {
  bad_password: 'Wrong password',
  unknown_email: 'Unknown email',
  locked: 'Locked account',
  throttled: 'Throttled',
  wrong_code: 'Wrong code',
  exhausted: 'Too many wrong codes',
  not_admin: 'Control panel, not an admin',
  disabled: 'Disabled account',
  exists: 'Sign-up, email exists',
  not_activated: 'Sign-in before activating',
  activation_expired: 'Expired activation link',
  activation_invalid: 'Invalid activation link',
};

export default async function StatisticsPage() {
  await requireOwner();
  const timeZone = await getTimeZone();
  const [totals, daily, countries, browsers, reasons, vpn, targets, failed] = await Promise.all([
    getUserTotals(),
    getDailyAuthActivity(timeZone, 30),
    topCountries(30),
    topBrowsers(30),
    failureReasons(30),
    getVpnShare(30),
    topFailedEmails(7),
    listSnapshots({ failedOnly: true, limit: 20 }),
  ]);

  const tiles = [
    { label: 'Users', value: totals.total, note: `${totals.active} active` },
    { label: 'New (30 days)', value: totals.newLast30, note: `${totals.pending} unconfirmed` },
    {
      label: 'Signed in (30 days)',
      value: totals.activeLast30,
      note: `${totals.onlineSessions} online now`,
    },
    { label: 'Admins', value: totals.admins, note: 'incl. owner' },
    { label: 'Locked now', value: totals.locked, note: `${totals.disabled} disabled` },
    {
      label: 'Via VPN / proxy',
      value: vpn.total ? `${Math.round((vpn.proxied / vpn.total) * 100)}%` : '—',
      note: `${vpn.mismatched} time-zone mismatches`,
    },
  ];

  return (
    <>
      <PageHeader title="Statistics" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <Panel key={t.label} className="p-4">
            <p className="text-sm text-ink/70 dark:text-paper/70">{t.label}</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{t.value}</p>
            <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{t.note}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <DailyBars
          title="Successful sign-ins"
          data={daily.map((d) => ({ day: d.day, value: d.signins }))}
        />
        <DailyBars
          title="Completed sign-ups"
          data={daily.map((d) => ({ day: d.day, value: d.signups }))}
        />
        <DailyBars
          title="Failed attempts"
          data={daily.map((d) => ({ day: d.day, value: d.failed }))}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <RankedBars title="Countries (30 days)" rows={countries} />
        <RankedBars title="Browsers (30 days)" rows={browsers} />
        <RankedBars
          title="Why attempts failed (30 days)"
          rows={reasons.map((r) => ({ label: REASONS[r.label] ?? r.label, n: r.n }))}
          empty="No failed attempts."
        />
      </div>

      <Panel className="mt-6 overflow-x-auto">
        <h3 className="mb-3 text-sm font-semibold">Most targeted accounts (7 days)</h3>
        {targets.length === 0 ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">No failed attempts.</p>
        ) : (
          <table className="w-full min-w-[600px] text-sm">
            <thead className="text-left text-xs text-ink/60 dark:text-paper/60">
              <tr>
                <th className="py-1 font-medium">Email</th>
                <th className="py-1 font-medium">Failures</th>
                <th className="py-1 font-medium">Distinct IPs</th>
                <th className="py-1 font-medium">Countries</th>
                <th className="py-1 font-medium">Last</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <tr key={t.email}>
                  <td className="py-1">{t.email}</td>
                  <td className="py-1 tabular-nums">{t.failures}</td>
                  <td className="py-1 tabular-nums">{t.ips}</td>
                  <td className="py-1">{t.countries ?? '—'}</td>
                  <td className="py-1 text-xs">
                    <DateTime value={t.last_at} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <h2 className="mt-10 mb-3 font-display text-xl tracking-tight">Latest failed attempts</h2>
      <SnapshotTable rows={failed} showEmail />
    </>
  );
}
