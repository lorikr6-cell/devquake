import Link from 'next/link';
import { notFound } from 'next/navigation';
import { brandedQrSvg } from '@devquake/ui/qr';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { hostUrl } from '@/lib/domain';
import { getReferral } from '@/lib/external-referrals';
import { PageHeader, Panel, linkClass } from '../../../_components/ui';
import { deleteReferralAction, saveReferralAction } from '../actions';
import { REFERRAL_ERRORS } from '../errors';
import { ReferralForm } from '../referral-form';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export async function generateMetadata({ params }: Props) {
  return { title: `Referral #${(await params).id}` };
}

export default async function ReferralPage({ params, searchParams }: Props) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const referral = await getReferral(id);
  if (!referral) notFound();
  const { saved, error } = await searchParams;
  const go = `${hostUrl()}/go/${referral.slug}`;

  return (
    <>
      <PageHeader
        title={referral.name}
        actions={
          <Link href={`${ADMIN_BASE}/referrals`} className={linkClass}>
            ← All referrals
          </Link>
        }
      />
      {saved ? (
        <p
          role="status"
          className="mb-6 rounded-md border border-ink/10 bg-white px-4 py-3 text-sm dark:border-paper/10 dark:bg-paper/5"
        >
          Saved. The landing page shows the change right away.
        </p>
      ) : null}
      {error && REFERRAL_ERRORS[error] ? (
        <p
          role="alert"
          className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
        >
          {REFERRAL_ERRORS[error]}
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <Panel>
          <ReferralForm
            action={saveReferralAction.bind(null, referral.id)}
            referral={referral}
            submitLabel="Save referral"
          />
        </Panel>
        <div className="space-y-6">
          <Panel>
            <h2 className="mb-2 font-semibold">QR code</h2>
            <div
              className="mx-auto size-40 rounded bg-white p-1 [&>svg]:size-full"
              // Generated from our own /go/<slug> address.
              dangerouslySetInnerHTML={{ __html: brandedQrSvg(go, { margin: 1 }) }}
            />
            <p className="mt-2 font-mono text-xs break-all">{go}</p>
            <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">
              {referral.clicks} clicks so far.{' '}
              <a href={`/go/${referral.slug}/qr`} download className={linkClass}>
                Download PNG
              </a>
            </p>
          </Panel>
          <Panel>
            <h2 className="mb-2 font-semibold text-red-700 dark:text-red-400">Delete</h2>
            <p className="mb-3 text-xs text-ink/70 dark:text-paper/70">
              Removes it from the landing page; its short link and QR code stop working. To pause it
              instead, untick “Shown on the landing page”.
            </p>
            <form action={deleteReferralAction.bind(null, referral.id)}>
              <button
                type="submit"
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                Delete referral
              </button>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}
