import type { PluginEmail, PluginLocale } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, localizePath } from '@devquake/ui';
import { translator } from '../i18n';
import { feedbackKey, longestStreak, groupByDay, totals, type WorkoutStat } from './stats';
import { clock } from './workout-state';

/**
 * The monthly summary email (ADR 0015), sent on the 1st for the month before. Days are UTC
 * days here: the scheduled run has no viewer and so no time zone.
 */

/** The month that ended before `now` ("YYYY-MM") and its UTC bounds; null before 12:00 UTC on
 *  the 1st, when the month has not ended yet everywhere. */
export function reportMonth(
  now: Date,
): { month: string; from: Date; to: Date; previousFrom: Date } | null {
  if (now.getUTCDate() === 1 && now.getUTCHours() < 12) return null;
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const previousFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
  return { month: from.toISOString().slice(0, 7), from, to, previousFrom };
}

export function monthlyEmail(args: {
  locale: PluginLocale;
  month: string;
  baseUrl: string;
  workouts: WorkoutStat[];
  previous: WorkoutStat[];
  hasMonthPhoto: boolean;
}): PluginEmail {
  const { locale, month, baseUrl } = args;
  const t = translator(locale);
  const [y, m] = month.split('-').map(Number) as [number, number];
  const monthName = new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(Date.UTC(y, m - 1, 1));
  const number = new Intl.NumberFormat(LOCALE_TAGS[locale]);
  const now = totals(args.workouts);
  const before = totals(args.previous);
  const url = (path: string) => `${baseUrl}${localizePath(path, locale)}`;

  const paragraphs = [t(`email.feedback.${feedbackKey(now, before)}`, { count: now.workouts })];
  if (!args.hasMonthPhoto) paragraphs.push(t('email.photo'));

  return {
    subject: t('email.subject', { month: monthName }),
    preheader: t('email.preheader', { count: now.workouts }),
    heading: t('email.heading', { month: monthName }),
    paragraphs,
    rows:
      now.workouts === 0
        ? undefined
        : [
            [t('stats.workouts'), number.format(now.workouts)],
            [t('stats.activeDays'), number.format(now.activeDays)],
            [t('stats.time'), clock(now.seconds)],
            [t('stats.kcal'), t('common.aboutKcal', { kcal: number.format(now.kcal) })],
            [t('stats.sets'), `${number.format(now.setsDone)} / ${number.format(now.setsPlanned)}`],
            [t('stats.reps'), number.format(now.reps)],
            [
              t('stats.streak'),
              t('stats.days', { count: longestStreak(groupByDay(args.workouts, 'UTC').keys()) }),
            ],
          ],
    button: { label: t('email.button'), url: url(`/history?view=month&date=${month}`) },
    footer: t('email.footer', { url: url('/profile') }),
  };
}
