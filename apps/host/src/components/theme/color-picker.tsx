'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cn, useT } from '@devquake/ui';
import { hexToHsv, hsvToHex, isHex } from '@/lib/custom-theme';

/** Colours offered with one tap: the brand's, and a few calm and strong ones. */
const PRESETS = [
  '#F4F1EA',
  '#FFFFFF',
  '#EEF2F7',
  '#FDF6E3',
  '#16181D',
  '#0F172A',
  '#1E1E2E',
  '#2B2D42',
  '#E4572E',
  '#2A62CC',
  '#127A65',
  '#7A4FD6',
  '#C23B6B',
  '#D97706',
];

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/**
 * A colour field: a swatch button that opens a picker with a saturation/brightness square, a
 * hue bar, a hex input and suggested colours. Every change is reported at once (`onChange`), so
 * the page can preview it. Keyboard: arrows move the square's cursor or the hue (Shift = faster).
 */
export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const t = useT('common.customTheme');
  const [open, setOpen] = useState(false);
  // Keep the hue while the colour is grey (grey has no hue of its own).
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [hex, setHex] = useState(value);
  const panelId = useId();
  const square = useRef<HTMLDivElement>(null);
  const hueBar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Outside changes (e.g. switching themes) move the cursor, unless it is the same colour.
    if (value.toUpperCase() !== hsvToHex(hsv.h, hsv.s, hsv.v)) {
      setHsv((old) => {
        const next = hexToHsv(value);
        return next.s === 0 || next.v === 0 ? { ...next, h: old.h } : next;
      });
    }
    setHex(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function commit(next: { h: number; s: number; v: number }) {
    setHsv(next);
    const out = hsvToHex(next.h, next.s, next.v);
    setHex(out);
    onChange(out);
  }

  function fromSquare(e: PointerEvent<HTMLDivElement>) {
    const box = square.current!.getBoundingClientRect();
    commit({
      h: hsv.h,
      s: clamp((e.clientX - box.left) / box.width),
      v: clamp(1 - (e.clientY - box.top) / box.height),
    });
  }

  function fromHue(e: PointerEvent<HTMLDivElement>) {
    const box = hueBar.current!.getBoundingClientRect();
    commit({ ...hsv, h: clamp((e.clientX - box.left) / box.width) * 359.9 });
  }

  function drag(handler: (e: PointerEvent<HTMLDivElement>) => void) {
    return {
      onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        handler(e);
      },
      onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) handler(e);
      },
    };
  }

  function squareKeys(e: KeyboardEvent) {
    const step = e.shiftKey ? 0.1 : 0.02;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    commit({ h: hsv.h, s: clamp(hsv.s + move[0]), v: clamp(hsv.v + move[1]) });
  }

  function hueKeys(e: KeyboardEvent) {
    const step = e.shiftKey ? 20 : 3;
    const delta =
      e.key === 'ArrowLeft' || e.key === 'ArrowDown'
        ? -step
        : e.key === 'ArrowRight' || e.key === 'ArrowUp'
          ? step
          : 0;
    if (!delta) return;
    e.preventDefault();
    commit({ ...hsv, h: (hsv.h + delta + 360) % 360 });
  }

  const pure = hsvToHex(hsv.h, 1, 1);
  return (
    <div className="rounded-md border border-ink/15 dark:border-paper/15">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm"
      >
        <span
          aria-hidden
          className="size-7 shrink-0 rounded-md ring-1 ring-ink/20 dark:ring-paper/30"
          style={{ background: value }}
        />
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{label}</span>
          <span className="block font-mono text-xs text-ink/60 dark:text-paper/60">{value}</span>
        </span>
        <span
          aria-hidden
          className={cn(
            'text-ink/50 transition-transform dark:text-paper/50',
            open && 'rotate-180',
          )}
        >
          ▾
        </span>
      </button>
      {open ? (
        <div id={panelId} className="space-y-3 border-t border-ink/10 p-3 dark:border-paper/10">
          <div
            ref={square}
            role="slider"
            tabIndex={0}
            aria-label={t('shade')}
            aria-valuetext={`${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%`}
            aria-valuenow={Math.round(hsv.s * 100)}
            onKeyDown={squareKeys}
            {...drag(fromSquare)}
            className="relative h-36 w-full cursor-crosshair touch-none rounded-md focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none"
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${pure})`,
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
              style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: value }}
            />
          </div>
          <div
            ref={hueBar}
            role="slider"
            tabIndex={0}
            aria-label={t('hue')}
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hsv.h)}
            onKeyDown={hueKeys}
            {...drag(fromHue)}
            className="relative h-4 w-full cursor-pointer touch-none rounded-full focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none"
            style={{
              background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
              style={{ left: `${(hsv.h / 360) * 100}%`, background: pure }}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink/70 dark:text-paper/70">{t('hex')}</span>
            <input
              value={hex}
              maxLength={7}
              spellCheck={false}
              onChange={(e) => {
                const next = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
                setHex(next);
                if (isHex(next)) {
                  setHsv(hexToHsv(next));
                  onChange(next.toUpperCase());
                }
              }}
              aria-invalid={!isHex(hex)}
              className="w-28 rounded-md border border-ink/20 bg-white px-2 py-1 font-mono text-sm text-ink uppercase aria-invalid:border-red-500 dark:border-paper/20 dark:bg-paper/5 dark:text-paper"
            />
          </label>
          <div role="group" aria-label={t('presets')} className="flex flex-wrap gap-1.5">
            {PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                aria-label={c}
                aria-pressed={c === value.toUpperCase()}
                onClick={() => {
                  setHsv(hexToHsv(c));
                  setHex(c);
                  onChange(c);
                }}
                className="size-7 rounded-md ring-1 ring-ink/20 aria-pressed:ring-2 aria-pressed:ring-quake dark:ring-paper/30"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
