'use client';

import { useEffect, useState } from 'react';

/**
 * Hidden inputs with what only the browser knows: time zone, language and screen size.
 * They go into the sign-in snapshot; a time zone that differs from the IP's is a VPN hint.
 */
export function ClientContextFields() {
  const [ctx, setCtx] = useState({ tz: '', lang: '', screen: '' });

  useEffect(() => {
    setCtx({
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
      lang: navigator.language ?? '',
      screen: `${window.screen.width}x${window.screen.height}@${window.devicePixelRatio || 1}`,
    });
  }, []);

  return (
    <>
      <input type="hidden" name="client_tz" value={ctx.tz} />
      <input type="hidden" name="client_lang" value={ctx.lang} />
      <input type="hidden" name="client_screen" value={ctx.screen} />
    </>
  );
}
