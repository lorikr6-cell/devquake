import type { ReactNode } from 'react';

// Line icons drawn on a 24 × 24 grid (stroke 2, round caps), inline like the theme picker's.
// Navigation icons plus the symbols a project logo can carry (lib/project-avatar.ts).

const NAV = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  lightbulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z" />
    </>
  ),
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
  community: (
    <>
      <path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="M17 9h3a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v3l-3.5-3H13" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </>
  ),
  activity: <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  send: (
    <>
      <path d="M21 3 10 14" />
      <path d="m21 3-7 18-4-7-7-4Z" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 13h5l1.5 3h5l1.5-3h5" />
      <path d="M5.5 5h13L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Z" />
    </>
  ),
  apps: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M17.5 14v7M14 17.5h7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </>
  ),
  panel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </>
  ),
  'chevrons-left': <path d="m11 17-5-5 5-5M18 17l-5-5 5-5" />,
  'chevrons-right': <path d="m13 17 5-5-5-5M6 17l5-5-5-5" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  'arrow-left': <path d="M19 12H5M11 18l-6-6 6-6" />,
} satisfies Record<string, ReactNode>;

const SYMBOLS = {
  sparkles: (
    <>
      <path d="M11 3.5 12.8 8.2 17.5 10 12.8 11.8 11 16.5 9.2 11.8 4.5 10 9.2 8.2Z" />
      <path d="M18.5 15v5M16 17.5h5" />
    </>
  ),
  cart: (
    <>
      <path d="M2.5 3.5h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.3h8.3a1.5 1.5 0 0 0 1.5-1.2L20.5 7.5H6.3" />
      <circle cx="9.5" cy="20" r="1.3" />
      <circle cx="17.5" cy="20" r="1.3" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7a2 2 0 0 1 2-2h11v4" />
      <path d="M4 7v11a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2Z" />
      <circle cx="16" cy="14.5" r="1.2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  chart: <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6M20 16V6" />,
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
      <path d="M4 20.5A2.5 2.5 0 0 0 6.5 21H20v-3" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  game: (
    <>
      <path d="M7 7h10a4.5 4.5 0 0 1 4.4 5.4l-.8 4A3 3 0 0 1 15.5 17l-1.5-2h-4l-1.5 2a3 3 0 0 1-5.1-.6l-.8-4A4.5 4.5 0 0 1 7 7Z" />
      <path d="M8 10v4M6 12h4M15.5 11h.01M17.5 13h.01" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M8 12h8" />
      <rect x="4.5" y="7" width="3.5" height="10" rx="1" />
      <rect x="16" y="7" width="3.5" height="10" rx="1" />
      <path d="M2.5 10v4M21.5 10v4" />
    </>
  ),
  utensils: (
    <>
      <path d="M6 3v7a2 2 0 0 0 2 2 2 2 0 0 0 2-2V3M8 3v18" />
      <path d="M17 21V3c-2 1.5-3 4-3 7v3h3" />
    </>
  ),
  plane: (
    <path d="M21 15.5v-2l-8-5V4a1.5 1.5 0 0 0-3 0v4.5l-8 5v2l8-2.5V18l-2.5 2v1.5L11.5 20l4 1.5V20L13 18v-5Z" />
  ),
  car: (
    <>
      <path d="M5 16H3v-4l2.2-5A2 2 0 0 1 7 6h10a2 2 0 0 1 1.8 1L21 12v4h-2" />
      <path d="M3 12h18M9 16h6" />
      <circle cx="7" cy="16.5" r="2" />
      <circle cx="17" cy="16.5" r="2" />
    </>
  ),
  home: (
    <>
      <path d="M3 11 12 3.5l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5M10 20v-5h4v5" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8a2 2 0 0 1 2-2h2.5L9 4h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  chat: (
    <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
  ),
  graduation: (
    <>
      <path d="M2 9.5 12 5l10 4.5-10 4.5Z" />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9.5V15" />
    </>
  ),
  check: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  code: <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />,
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 5-14 15-15-.5 10-6.5 15-13 15Z" />
      <path d="M5 19 13 11" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" />
    </>
  ),
  heart: (
    <path d="M12 20s-8-4.8-8-10.5A4.5 4.5 0 0 1 12 6.8a4.5 4.5 0 0 1 8 2.7C20 15.2 12 20 12 20Z" />
  ),
  star: <path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4l-5.5 2.9 1-6.2L3 9.7l6.2-.9Z" />,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7Z" />,
} satisfies Record<string, ReactNode>;

export type NavIconName = keyof typeof NAV;
export type ProjectSymbol = keyof typeof SYMBOLS;
export type IconName = NavIconName | ProjectSymbol;

const PATHS: Record<IconName, ReactNode> = { ...NAV, ...SYMBOLS };

/** A decorative line icon (aria-hidden): the text next to it, or a label, names the action. */
export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
