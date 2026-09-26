'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';

/**
 * A dialog that always fits the screen: a bottom sheet on phones, a centred box on larger
 * screens. It is rendered at the end of <body> (a portal), because toolbars with a backdrop
 * blur turn `position: fixed` into "fixed to the toolbar" and would cut it off. It is never
 * taller than the visible screen (portrait or landscape, notches included) and scrolls inside
 * when its content does not fit. Esc, the backdrop and `onClose` close it.
 */
export function Sheet({
  open,
  onClose,
  labelledBy,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  /** id of the dialog's heading */
  labelledBy: string;
  children: ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // The page behind does not scroll while the dialog is open.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 pt-[max(0.5rem,env(safe-area-inset-top))] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'max-h-[calc(100dvh-max(0.5rem,env(safe-area-inset-top)))] w-full overflow-y-auto overscroll-contain rounded-t-2xl bg-paper p-4 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] text-ink shadow-xl outline-none sm:max-h-[calc(100dvh-2rem)] sm:max-w-md sm:rounded-2xl dark:bg-ink dark:text-paper',
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
