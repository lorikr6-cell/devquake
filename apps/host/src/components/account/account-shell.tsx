import type { ReactNode } from 'react';
import { SideNav, type SideNavGroup } from '@/components/side-nav';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import type { SessionUser } from '@/lib/auth/session';
import { MY_MESSAGES_PATH, countUnreadReplies } from '@/lib/contact';
import { isSideNavCollapsed } from '@/lib/side-nav-server';
import { getT } from '@/i18n/server';
import type { Translate } from '@devquake/ui';

// Height of the sticky site header: the sidebar and the phone menu bar stick below it.
const HEADER_HEIGHT = 71;

/**
 * The account dashboard's menu. On /account the sections are anchors on the page; elsewhere
 * (e.g. /account/messages) the same entries link back to them.
 */
function accountNav(
  t: Translate,
  user: SessionUser,
  onAccountPage: boolean,
  unread: number,
): SideNavGroup[] {
  const section = (id: string) => (onAccountPage ? `#${id}` : `/account#${id}`);
  return [
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
        { href: '/ideas', label: t('ideas'), icon: 'lightbulb' },
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

/** Header, account menu (sidebar / phone drawer) and footer around an account page. */
export async function AccountShell({
  user,
  page,
  children,
}: {
  user: SessionUser;
  page: 'account' | 'messages';
  children: ReactNode;
}) {
  const [collapsed, unread, t] = await Promise.all([
    isSideNavCollapsed(),
    countUnreadReplies(user.userId),
    getT('common.accountNav'),
  ]);
  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      <SiteHeader />
      <div className="mx-auto max-w-6xl lg:flex lg:gap-10 lg:px-6">
        <SideNav
          label={t('label')}
          groups={accountNav(t, user, page === 'account', unread)}
          initialCollapsed={collapsed}
          top={HEADER_HEIGHT}
        />
        <main className="min-w-0 flex-1 px-6 py-12 lg:max-w-4xl lg:px-0">{children}</main>
      </div>
      <SiteFooter />
    </div>
  );
}
