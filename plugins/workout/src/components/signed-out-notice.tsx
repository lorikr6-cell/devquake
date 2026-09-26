'use client';

import { useT } from '@devquake/ui';
import { signInHref } from './draft-rescue';

/** After a save failed because the sign-in ended: what was entered is kept; sign in again. */
export function SignedOutNotice({ hostUrl }: { hostUrl: string }) {
  const t = useT('drafts');
  return (
    <div
      role="alert"
      className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-950 dark:bg-amber-900/60 dark:text-amber-100"
    >
      <p>{t('signedOut')}</p>
      <a
        href={signInHref(hostUrl)}
        className="mt-1 inline-block font-semibold underline underline-offset-2"
      >
        {t('signIn')}
      </a>
    </div>
  );
}
