import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@devquake/ui';

// Small building blocks in the DevQuake style (docs/brand.md), sized for phones: touch targets
// are at least 44 px high.

export const fieldClass =
  'w-full rounded-md border border-ink/15 bg-white px-3 py-2.5 text-base text-ink placeholder:text-ink/40 focus:border-quake focus:outline-none focus:ring-2 focus:ring-quake/30 dark:border-paper/15 dark:bg-ink dark:text-paper dark:placeholder:text-paper/40';

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block text-sm', className)}>
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {hint ? (
        <span className="mt-1 block text-xs text-ink/60 dark:text-paper/60">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'rounded-xl border border-ink/10 bg-white/70 p-4 sm:p-5 dark:border-paper/10 dark:bg-paper/5',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-red-700 dark:text-red-400">
      {children}
    </p>
  );
}

export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel className="mx-auto max-w-lg text-center">
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <div className="mt-3 text-sm text-ink/70 dark:text-paper/70">{children}</div>
    </Panel>
  );
}

/**
 * An icon from this app's own icon set (src/illustrations/icons.ts, or the same markup from the
 * equipment table, which only the seed migration writes). Never pass user input.
 */
export function SvgIcon({ svg, className }: { svg: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block shrink-0 [&>svg]:h-full [&>svg]:w-full', className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
