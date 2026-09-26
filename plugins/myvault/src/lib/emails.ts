import type { PluginEmail, PluginLocale } from '@devquake/plugin-sdk';
import { localizePath } from '@devquake/ui';
import { translator } from '../i18n';
import { LOCK_HOURS, formatVaultKey } from './model';

/**
 * The vault's emails (plain text; the host escapes them and uses the DevQuake layout, ADR 0014).
 * The recipient's time zone is not known here, so they speak in days and hours, not clock times
 * (ADR 0010: times are only shown in the reader's own zone).
 */

/** To the owner, before a release: sign in (anywhere on DevQuake) to postpone it. */
export function warningEmail(
  e: { title: string; daysLeft: number },
  locale: PluginLocale,
  baseUrl: string,
): PluginEmail {
  const t = translator(locale, 'mail');
  return {
    subject: t('warnSubject', { title: e.title }),
    preheader: t('warnPreheader', { count: e.daysLeft }),
    heading: t('warnHeading'),
    paragraphs: [t('warnBody', { title: e.title, count: e.daysLeft }), t('warnAction')],
    button: { label: t('warnButton'), url: `${baseUrl}${localizePath('/', locale)}` },
    footer: t('footer'),
  };
}

/** To a recipient: the vault key and the link to open the entry. */
export function releaseEmail(
  e: { entryId: number; title: string; ownerName: string; key: Uint8Array },
  locale: PluginLocale,
  baseUrl: string,
): PluginEmail {
  const t = translator(locale, 'mail');
  return {
    subject: t('releaseSubject', { name: e.ownerName }),
    preheader: t('releasePreheader', { title: e.title }),
    heading: t('releaseHeading', { name: e.ownerName }),
    paragraphs: [
      t('releaseBody', { name: e.ownerName, title: e.title }),
      t('releaseHow'),
      t('releaseKeep'),
    ],
    rows: [
      [t('entry'), e.title],
      [t('vaultKey'), formatVaultKey(e.key)],
    ],
    button: {
      label: t('releaseButton'),
      url: `${baseUrl}${localizePath(`/open/${e.entryId}`, locale)}`,
    },
    footer: t('footer'),
  };
}

/** To the owner, when an entry got locked after 3 wrong tries. */
export function lockEmail(
  e: { entryId: number; title: string },
  locale: PluginLocale,
  baseUrl: string,
): PluginEmail {
  const t = translator(locale, 'mail');
  return {
    subject: t('lockSubject', { title: e.title }),
    preheader: t('lockPreheader'),
    heading: t('lockHeading'),
    paragraphs: [t('lockBody', { title: e.title, hours: LOCK_HOURS }), t('lockAction')],
    button: {
      label: t('lockButton'),
      url: `${baseUrl}${localizePath(`/entries/${e.entryId}`, locale)}`,
    },
    footer: t('footer'),
  };
}
