'use client';

import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { startTrialForTab } from '@/lib/trial-actions';

/**
 * "Try it for 24 hours" that opens the app in a new tab, like the Open buttons. The tab is
 * opened on the click itself (browsers block tabs opened later), then sent to the app once the
 * trial has started; when no trial could start it is closed again and this page refreshes to
 * explain why. If the browser blocks the tab, the app opens here instead.
 */
export function TrialButton({
  projectId,
  className,
  children,
}: {
  projectId: number;
  className: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    const tab = window.open('about:blank', '_blank');
    try {
      const url = await startTrialForTab(projectId);
      if (url && tab) {
        tab.opener = null;
        tab.location.href = url;
      } else if (url) {
        window.location.href = url;
        return;
      } else {
        tab?.close();
      }
    } catch {
      tab?.close();
    }
    router.refresh();
    setBusy(false);
  }

  return (
    <button type="button" className={className} disabled={busy} onClick={() => void start()}>
      {children}
    </button>
  );
}
