import type { PluginPageProps } from '@devquake/plugin-sdk';
import { buttonClass, Link, LOCALE_TAGS } from '@devquake/ui';
import { pageScope } from '../components/guard';
import { PhotoCompare, type ComparePhoto } from '../components/photo-compare';
import { PhotoSlot } from '../components/photo-slot';
import { Panel } from '../components/ui';
import { localeOf, translator } from '../i18n';
import { photoUrl } from '../lib/photos';
import { listPhotos, type PhotoInfo } from '../lib/progress';
import { localDay } from '../lib/stats';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.progress') };
}

/**
 * The transformation (ADR 0015): the starting photo, then one photo per month and per year,
 * in order, with a before-and-after comparison. Every photo is optional and private.
 */
export default async function Progress({ ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const locale = localeOf(ctx);
  const t = translator(locale);
  const tag = LOCALE_TAGS[locale];
  const photos = await listPhotos(scope.db, scope.user.id);
  const today = localDay(new Date().toISOString(), ctx.timeZone ?? 'UTC');
  const month = today.slice(0, 7);

  const monthName = new Intl.DateTimeFormat(tag, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const dayName = new Intl.DateTimeFormat(tag, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const labelOf = (p: PhotoInfo) => {
    const date = new Date(`${p.period}T12:00:00Z`);
    if (p.kind === 'start') return t('photos.startLabel', { date: dayName.format(date) });
    if (p.kind === 'year') return t('photos.yearTitle', { year: p.period.slice(0, 4) });
    return monthName.format(date);
  };
  const find = (kind: PhotoInfo['kind'], period?: string) => {
    const p = photos.find((x) => x.kind === kind && (!period || x.period === period));
    return p ? { id: p.id, version: p.version } : null;
  };
  const compare: ComparePhoto[] = photos.map((p) => ({
    id: p.id,
    version: p.version,
    label: labelOf(p),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('photos.title')}</h1>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('photos.intro')}</p>
        </div>
        <Link href="/history" className={buttonClass('secondary', 'min-h-11')}>
          {t('nav.calendar')}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PhotoSlot
          kind="start"
          period="current"
          photo={find('start')}
          title={t('photos.startTitle')}
        />
        <PhotoSlot
          kind="month"
          period={month}
          photo={find('month', `${month}-01`)}
          title={t('photos.monthTitle', {
            month: monthName.format(new Date(`${month}-01T12:00:00Z`)),
          })}
        />
      </div>

      {compare.length >= 2 ? (
        <Panel>
          <h2 className="font-display text-xl font-bold">{t('photos.compareTitle')}</h2>
          <div className="mt-3">
            <PhotoCompare photos={compare} />
          </div>
        </Panel>
      ) : (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('photos.compareHint')}</p>
      )}

      {photos.length ? (
        <section>
          <h2 className="font-display text-xl font-bold">{t('photos.timeline')}</h2>
          <ol className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2">
            {photos.map((p) => (
              <li key={p.id} className="w-36 shrink-0 snap-start">
                <img
                  src={photoUrl(p.id, p.version)}
                  alt={labelOf(p)}
                  loading="lazy"
                  className="aspect-[3/4] w-full rounded-lg bg-ink/5 object-cover dark:bg-paper/10"
                />
                <p className="mt-1 text-xs font-medium">{labelOf(p)}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <p className="text-xs text-ink/50 dark:text-paper/50">{t('photos.privacy')}</p>
    </div>
  );
}
