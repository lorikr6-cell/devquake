import type { ReactNode } from 'react';
import { cn } from '@devquake/ui';
import { SideNav, type SideNavGroup } from '@/components/side-nav';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getSessionUser, type SessionUser } from '@/lib/auth/session';
import { MY_MESSAGES_PATH, countUnreadReplies } from '@/lib/contact';
import { getT } from '@/i18n/server';
import type { Translate } from '@devquake/ui';

// Height of the sticky site header: the sidebar and the phone menu bar stick below it.
const HEADER_HEIGHT = 71;

/**
 * The platform menu for signed-in members, on every main page. On /account the account sections
 * are anchors on the page; elsewhere the same entries link to them.
 */
function platformNav(
  t: Translate,
  user: SessionUser,
  onAccountPage: boolean,
  unread: number,
): SideNavGroup[] {
  const section = (id: string) => (onAccountPage ? `#${id}` : `/account#${id}`);
  return [
    {
      title: t('groupSite'),
      items: [
        { href: '/', label: t('home'), icon: 'home' },
        { href: '/ideas', label: t('ideas'), icon: 'lightbulb' },
      ],
    },
    {
      title: t('groupAccount'),
      items: [
        { href: section('profile'), label: t('profile'), icon: 'user' },
        { href: MY_MESSAGES_PATH, label: t('messages'), icon: 'mail', badge: unread },
        { href: section('invite'), label: t('invite'), icon: 'send' },
        { href: section('invitations'), label: t('invitations'), icon: 'inbox' },
      ],
    },
    {
      title: t('groupProjects'),
      items: [
        { href: section('available-projects'), label: t('available'), icon: 'apps' },
        { href: section('your-projects'), label: t('yourProjects'), icon: 'folder' },
      ],
    },
    {
      title: t('groupPrivacy'),
      items: [
        { href: section('account-activity'), label: t('accountActivity'), icon: 'activity' },
        { href: section('signin-activity'), label: t('signinActivity'), icon: 'shield' },
        { href: section('delete-account'), label: t('deleteAccount'), icon: 'trash' },
      ],
    },
    ...(user.isAdmin
      ? [
          {
            title: t('groupAdmin'),
            items: [{ href: '/admin-cp', label: t('controlPanel'), icon: 'dashboard' as const }],
          },
        ]
      : []),
  ];
}

/**
 * Header, platform menu and footer around a main page of the site. Signed-in members get the
 * menu as a slim icon column at the left edge of the window (labels as tooltips), like the
 * control panel; phones and tablets get it as a drawer. Signed-out visitors get no menu.
 */
export async function PlatformShell({
  children,
  page,
  width = 'max-w-5xl',
  mainClassName,
}: {
  children: ReactNode;
  /** 'account' when the account sections are on this page (their menu links are anchors). */
  page?: 'account' | 'messages';
  /** Width of the content column. */
  width?: string;
  mainClassName?: string;
}) {
  const user = await getSessionUser().catch(() => null);
  const [unread, t] = await Promise.all([
    user ? countUnreadReplies(user.userId).catch(() => 0) : Promise.resolve(0),
    getT('common.accountNav'),
  ]);
  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      <SiteHeader />
      <div className="lg:flex">
        {user ? (
          <SideNav
            label={t('label')}
            groups={platformNav(t, user, page === 'account', unread)}
            initialCollapsed
            alwaysCollapsed
            top={HEADER_HEIGHT}
          />
        ) : null}
        <main className={cn('mx-auto w-full min-w-0 flex-1 px-6 py-12', width, mainClassName)}>
          {children}
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}

/** The account pages (kept for their imports): the platform frame with the account sections. */
export function AccountShell({
  page,
  children,
}: {
  user: SessionUser;
  page: 'account' | 'messages';
  children: ReactNode;
}) {
  return (
    <PlatformShell page={page} width="max-w-4xl">
      {children}
    </PlatformShell>
  );
}
