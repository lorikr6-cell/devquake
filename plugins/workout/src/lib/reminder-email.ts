import type { PluginEmail, PluginLocale } from '@devquake/plugin-sdk';
import { localizePath } from '@devquake/ui';
import { translator } from '../i18n';
import { formatTime } from './plan';

/** The reminder email for a planned workout (ADR 0019), in the person's language. */
export function reminderEmail(args: {
  locale: PluginLocale;
  baseUrl: string;
  /** The routine's own name, or null for a suggested routine (named by its template). */
  name: string | null;
  template: string | null;
  start: number;
  duration: number;
  routineId: number;
}): PluginEmail {
  const t = translator(args.locale);
  const routine = args.name ?? t(`templates.${args.template ?? 'custom'}`);
  const time = formatTime(args.start);
  const url = (path: string) => `${args.baseUrl}${localizePath(path, args.locale)}`;
  return {
    subject: t('reminder.subject', { routine, time }),
    preheader: t('reminder.preheader', { minutes: args.duration }),
    heading: t('reminder.heading', { routine }),
    paragraphs: [t('reminder.body', { time, minutes: args.duration })],
    button: { label: t('reminder.button'), url: url(`/routines/${args.routineId}`) },
    footer: t('reminder.footer', { url: url('/plan') }),
  };
}
