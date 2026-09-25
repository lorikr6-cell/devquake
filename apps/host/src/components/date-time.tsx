import { formatDateTime, type DateTimeStyle } from '@devquake/ui';
import { getLocale } from '@/i18n/server';
import { getTimeZone } from '@/lib/timezone-server';

/** A timestamp in the viewer's own time zone (server component; ADR 0010). */
export async function DateTime({
  value,
  style = 'datetime',
}: {
  value: Date | string | null | undefined;
  style?: DateTimeStyle;
}) {
  if (!value) return <>—</>;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return <>—</>;
  const [zone, locale] = await Promise.all([getTimeZone(), getLocale()]);
  return <time dateTime={date.toISOString()}>{formatDateTime(date, zone, style, locale)}</time>;
}
