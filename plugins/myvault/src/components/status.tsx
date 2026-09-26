import { formatDateTime, type Translate } from '@devquake/ui';
import type { PluginLocale } from '@devquake/plugin-sdk';
import type { EntrySummary } from '../lib/data';

/** One line about an entry's state: private, waiting for release, released, locked. */
export function entryStatus(
  e: EntrySummary,
  t: Translate,
  timeZone: string,
  locale: PluginLocale,
): { icon: string; text: string } {
  if (e.lockedUntil) {
    return {
      icon: '🔒',
      text: t('locked', { until: formatDateTime(e.lockedUntil, timeZone, 'datetime', locale) }),
    };
  }
  if (e.releasedAt) {
    return {
      icon: '📨',
      text: t('released', { date: formatDateTime(e.releasedAt, timeZone, 'long-date', locale) }),
    };
  }
  if (e.recipients.length && e.inactiveDays) {
    return {
      icon: '⏳',
      text: t('willRelease', { names: e.recipients.join(', '), days: e.inactiveDays }),
    };
  }
  return { icon: '🛡️', text: t('private') };
}
