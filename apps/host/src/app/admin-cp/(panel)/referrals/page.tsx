import Link from 'next/link';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { listAllReferrals } from '@/lib/external-referrals';
import { PageHeader, Panel, linkClass } from '../../_components/ui';

export const metadata = { title: 'Referrals' };

/** External referrals (ADR 0021): partner links on the landing page, with their clicks. */
export default async function ReferralsPage() {
  await requireAdmin();
  const referrals = await listAllReferrals();
  return (
    <>
      <PageHeader
        title="External referrals"
        actions={
          <Link href={`${ADMIN_BASE}/referrals/new`} className={linkClass}>
            + New referral
          </Link>
        }
      />
      <p className="mb-4 max-w-prose text-sm text-ink/70 dark:text-paper/70">
        Partner referral links shown on the landing page like the Hostinger box, each with a QR
        code. Visitors go through <code>devquake.com/go/&lt;short link&gt;</code>, which counts
        clicks (no personal data) and forwards to the partner.
      </p>
      <Panel className="overflow-x-auto p-0">
        <table className="w-full min-w-160 text-sm">
          <thead className="border-b border-ink/10 text-left text-xs text-ink/60 dark:border-paper/10 dark:text-paper/60">
            <tr>
              <th className="px-4 py-2 font-medium">Partner</th>
              <th className="px-4 py-2 font-medium">Short link</th>
              <th className="px-4 py-2 font-medium">Clicks</th>
              <th className="px-4 py-2 font-medium">Shown</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5 dark:divide-paper/10">
            {referrals.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{r.name}</p>
                  <p className="max-w-md truncate font-mono text-xs text-ink/60 dark:text-paper/60">
                    {r.url}
                  </p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">/go/{r.slug}</td>
                <td className="px-4 py-3 tabular-nums">{r.clicks}</td>
                <td className="px-4 py-3 text-xs">{r.isActive ? 'Yes' : 'Hidden'}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`${ADMIN_BASE}/referrals/${r.id}`} className={linkClass}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {referrals.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/60 dark:text-paper/60">
                  No referrals yet. Is database migration 0020 imported?
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
