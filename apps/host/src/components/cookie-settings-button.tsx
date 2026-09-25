'use client';

import { useT } from '@devquake/ui';
import { openCookieSettings } from './analytics';

export function CookieSettingsButton({ className }: { className?: string }) {
  const t = useT('common.footer');
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      {t('cookieSettings')}
    </button>
  );
}
