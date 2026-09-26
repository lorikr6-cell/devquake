import Link from 'next/link';
import { ADMIN_BASE, requireAdmin } from '@/lib/auth/admin';
import { PageHeader, Panel, linkClass } from '../../../_components/ui';
import { saveReferralAction } from '../actions';
import { REFERRAL_ERRORS } from '../errors';
import { ReferralForm } from '../referral-form';

export const metadata = { title: 'New referral' };

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewReferralPage({ searchParams }: Props) {
  await requireAdmin();
  const { error } = await searchParams;
  return (
    <>
      <PageHeader
        title="New referral"
        actions={
          <Link href={`${ADMIN_BASE}/referrals`} className={linkClass}>
            ← All referrals
          </Link>
        }
      />
      {error && REFERRAL_ERRORS[error] ? (
        <p
          role="alert"
          className="mb-6 max-w-3xl rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
        >
          {REFERRAL_ERRORS[error]}
        </p>
      ) : null}
      <Panel className="max-w-3xl">
        <ReferralForm action={saveReferralAction.bind(null, null)} submitLabel="Create referral" />
      </Panel>
    </>
  );
}
