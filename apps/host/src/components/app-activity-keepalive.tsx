'use client';

import { useEffect } from 'react';

/** How often, at most, activity is reported. */
const PING_EVERY_MS = 5 * 60_000;
const EVENTS = ['pointerdown', 'keydown', 'input', 'wheel', 'touchstart'] as const;

/**
 * Keeps the sign-in going while the visitor is actively using an app (ADR 0014): after a tap,
 * a key press or typing, it tells the host at most every five minutes. That keeps the sign-in
 * from going idle and extends it when it would end soon (never past 24 hours after signing in).
 * An app left open without use still signs out as usual.
 */
export function AppActivityKeepAlive() {
  useEffect(() => {
    let active = false;
    let lastPing = Date.now();
    const ping = () => {
      if (!active || document.visibilityState !== 'visible') return;
      active = false;
      lastPing = Date.now();
      fetch('/api/_active', { method: 'POST', credentials: 'same-origin' }).catch(() => {
        // best effort: the next activity tries again
      });
    };
    const onActivity = () => {
      active = true;
      if (Date.now() - lastPing >= PING_EVERY_MS) ping();
    };
    for (const e of EVENTS) window.addEventListener(e, onActivity, { passive: true });
    const timer = window.setInterval(ping, PING_EVERY_MS);
    return () => {
      for (const e of EVENTS) window.removeEventListener(e, onActivity);
      window.clearInterval(timer);
    };
  }, []);
  return null;
}
