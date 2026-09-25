import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { Calendar } from '../components/calendar';
import { pageScope } from '../components/guard';
import { CreateListForm, JoinForm } from '../components/home-forms';
import { LiveRefresh } from '../components/live-refresh';
import { StatsView } from '../components/stats-view';
import { SwipeTabs } from '../components/swipe-tabs';
import { TodayView, type ListDetails } from '../components/today-view';
import { Panel } from '../components/ui';
import { changesFingerprint, itemsOfLists, listsForUser, statsInput } from '../lib/data';
import { addDays, todayIn } from '../lib/dates';
import { buildStats } from '../lib/stats';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.home') };
}

/**
 * Home: four tabs that can be swiped on phones. "Today" (default) shows today's lists with
 * products and prices, "Calendar" every list by date, "New list" creates or joins one, and
 * "Statistics" sums everything up.
 */
export default async function Home({ ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user } = scope;
  const t = translator(localeOf(ctx), 'home');

  // Today in the visitor's time zone (ctx.timeZone, ADR 0010); the browser re-checks it.
  // Items are loaded for one day around it in case the zone is not known yet.
  const serverToday = todayIn(ctx.timeZone);
  const [lists, input, fingerprint] = await Promise.all([
    listsForUser(db, user.id),
    statsInput(db, user.id),
    changesFingerprint(db, user.id),
  ]);
  const near = lists.filter(
    (l) => l.shopDate >= addDays(serverToday, -1) && l.shopDate <= addDays(serverToday, 1),
  );
  const items = await itemsOfLists(
    db,
    user.id,
    near.map((l) => l.id),
  );
  const details: Record<number, ListDetails> = Object.fromEntries(items);

  return (
    <div>
      <h1 className="sr-only">{t('srTitle')}</h1>
      <LiveRefresh fingerprint={fingerprint} />
      <SwipeTabs
        label={t('tabs')}
        tabs={[
          {
            id: 'today',
            label: t('today'),
            content: <TodayView lists={lists} details={details} serverToday={serverToday} />,
          },
          {
            id: 'calendar',
            label: t('calendar'),
            content: <Calendar lists={lists} serverToday={serverToday} />,
          },
          {
            id: 'new',
            label: t('new'),
            content: (
              <div className="grid gap-4 sm:grid-cols-2">
                <Panel>
                  <h2 className="font-display text-lg font-semibold">{t('planTitle')}</h2>
                  <CreateListForm serverToday={serverToday} />
                </Panel>
                <Panel>
                  <h2 className="font-display text-lg font-semibold">{t('joinTitle')}</h2>
                  <JoinForm />
                </Panel>
              </div>
            ),
          },
          {
            id: 'stats',
            label: t('stats'),
            content: <StatsView stats={buildStats(input)} />,
          },
        ]}
      />
    </div>
  );
}
