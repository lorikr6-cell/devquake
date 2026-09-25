import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { DEFAULT_TIME_ZONE, isTimeZone } from '@devquake/ui';
import { TZ_COOKIE } from './timezone';

/**
 * The visitor's time zone for server-rendered dates (ADR 0010): from the dq_tz cookie that the
 * browser keeps up to date, UTC until it is known. Every date shown to a person is formatted
 * with this (formatDateTime from @devquake/ui, or <DateTime>).
 */
export const getTimeZone = cache(async (): Promise<string> => {
  const value = (await cookies()).get(TZ_COOKIE)?.value;
  const zone = value ? decodeURIComponent(value) : '';
  return isTimeZone(zone) ? zone : DEFAULT_TIME_ZONE;
});
