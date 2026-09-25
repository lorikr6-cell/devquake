import type { EquipmentSlug, Location } from '../lib/catalog';
import { generatedIcon } from './auto';

/**
 * Small line icons (24 × 24, stroke currentColor), drawn for this app (ADR 0013). The equipment
 * icons are stored with the equipment rows by the seed migration (equipment.icon_svg); the place
 * icons are only used in the pages. Only markup from this file is ever rendered as SVG.
 */

const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

/** Drawn icons. Equipment added without one gets a generated badge (equipmentIcon). */
export const EQUIPMENT_ICONS: Partial<Record<EquipmentSlug, string>> = {
  dumbbells: svg(
    '<path d="M6.5 12h11"/><rect x="3" y="8" width="3.5" height="8" rx="1"/><rect x="17.5" y="8" width="3.5" height="8" rx="1"/><path d="M1.5 10.5v3M22.5 10.5v3"/>',
  ),
  kettlebell: svg(
    '<path d="M8.5 9.5a3.5 3.5 0 1 1 7 0"/><path d="M7.2 10h9.6l1.2 1.8a7 7 0 1 1-12 0z"/>',
  ),
  barbell: svg(
    '<path d="M1.5 12h21"/><rect x="4" y="6" width="3" height="12" rx="1"/><rect x="17" y="6" width="3" height="12" rx="1"/><path d="M7 9v6M17 9v6"/>',
  ),
  squat_rack: svg(
    '<path d="M5 21V3M19 21V3M3 21h4M17 21h4"/><path d="M5 9h2M19 9h-2"/><path d="M2 8h20"/>',
  ),
  bench: svg(
    '<rect x="3" y="9" width="18" height="3" rx="1"/><path d="M6 12v7M18 12v7M4 19h4M16 19h4"/>',
  ),
  pull_up_bar: svg(
    '<path d="M3 5h18M5 5v2M19 5v2"/><circle cx="12" cy="9.5" r="1.8"/><path d="M9 5l2 3M15 5l-2 3M12 11.5v5M12 16.5l-2 4M12 16.5l2 4"/>',
  ),
  resistance_bands: svg(
    '<path d="M5 7c4 5 10 5 14 0"/><path d="M5 17c4-5 10-5 14 0"/><rect x="2" y="5" width="3" height="14" rx="1.5"/><rect x="19" y="5" width="3" height="14" rx="1.5"/>',
  ),
  jump_rope: svg(
    '<path d="M5 4v6M19 4v6"/><path d="M5 10c0 11 14 11 14 0"/><circle cx="5" cy="3.5" r="1.5"/><circle cx="19" cy="3.5" r="1.5"/>',
  ),
  box: svg('<path d="M4 9l8-4 8 4v9l-8 4-8-4z"/><path d="M4 9l8 4 8-4M12 13v9"/>'),
  treadmill: svg(
    '<path d="M2 18h15l2-2"/><circle cx="4" cy="20" r="1"/><circle cx="15" cy="20" r="1"/><path d="M17 16l3-11h-4"/>',
  ),
  exercise_bike: svg(
    '<circle cx="12" cy="16" r="3"/><path d="M7 6h4M9 6l3 10M12 16l4-9h3"/><path d="M5 21h14"/>',
  ),
  rowing_machine: svg(
    '<path d="M2 18h18"/><circle cx="20" cy="14" r="2.5"/><rect x="7" y="15" width="5" height="3" rx="1"/><path d="M15 18l2-5M5 18v3M20 18v3"/>',
  ),
  cable_machine: svg(
    '<rect x="15" y="2" width="5" height="20" rx="1"/><circle cx="15" cy="6" r="1.5"/><path d="M13.6 6.5L6 14"/><path d="M4 14h4"/><path d="M16 14h3M16 17h3M16 20h3"/>',
  ),
  leg_press: svg(
    '<path d="M3 20L20 4"/><rect x="13" y="6" width="6" height="3" rx="1" transform="rotate(-43 16 7.5)"/><path d="M3 20h8l-3-5"/>',
  ),
  leg_machines: svg(
    '<rect x="3" y="11" width="10" height="3" rx="1"/><path d="M5 14v7M11 14v7M13 12.5h5v7"/><circle cx="18" cy="20" r="1.5"/><path d="M5 11V4"/>',
  ),
  chest_press_machine: svg(
    '<path d="M4 21V5M4 13h6M4 9h3"/><path d="M10 13h10M17 10v6M20 10v6"/><path d="M2 21h6"/>',
  ),
};

export const LOCATION_ICONS: Record<Location, string> = {
  gym: svg(
    '<path d="M6.5 12h11"/><rect x="3" y="7" width="3.5" height="10" rx="1"/><rect x="17.5" y="7" width="3.5" height="10" rx="1"/>',
  ),
  home: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  outside: svg('<circle cx="17" cy="6" r="3"/><path d="M2 20l6-8 4 5 3-3 7 6z"/>'),
};

/** The equipment's drawn icon, or a generated badge with its initials. */
export function equipmentIcon(slug: string): string {
  return EQUIPMENT_ICONS[slug as EquipmentSlug] ?? generatedIcon(slug);
}
