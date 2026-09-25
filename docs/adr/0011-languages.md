# ADR 0011: Languages (English, German, Romanian, Hungarian)

Status: accepted · 2026-09-25

## Context

DevQuake and its apps were English only. Visitors from Germany, Romania and Hungary should be
able to use everything in their language, on devquake.com and on every app subdomain, with a
language picker in each toolbar. The control panel (`/admin-cp`) is an internal tool and stays
English.

## Decision

- **Locales**: `en` (default), `de`, `ro`, `hu` (`LOCALES` in `@devquake/ui`).
- **The language is in the path.** English keeps today's URLs (`/ideas`); the others are
  prefixed (`/de/ideas`, `shopping.devquake.com/ro/lists/4`). `/en/...` redirects to the
  unprefixed URL. Every language version has its own URL, so search engines index each one.
- **The proxy strips the prefix** before routing (host routes and plugins stay unaware of it)
  and passes the language in the `x-devquake-locale` request header. API routes (`/api/...`)
  and server actions have no prefix of their own: they use the page's prefix when there is one,
  otherwise the `dq_lang` cookie.
- **Default language**: the `dq_lang` cookie (shared by `*.devquake.com`) remembers the
  visitor's choice. Without it, the first page visit uses the browser's `Accept-Language` when it
  is one of our languages, otherwise English. An unprefixed page request for someone whose
  language is not English is redirected (307) to the prefixed URL. Only real page loads are
  redirected (not client navigations, prefetches, API calls or crawlers without
  `Accept-Language`). Visiting a prefixed URL sets the cookie, so links shared in another
  language switch the visitor to it.
- **Picker**: `LanguagePicker` (`@devquake/ui`) in the site header and in every app toolbar. It
  sets the cookie and loads the same page in the chosen language.
- **Texts** live in message catalogs, English is the source: host in
  `apps/host/src/i18n/messages/<locale>.ts`, each app in `plugins/<id>/src/i18n/`. The German,
  Romanian and Hungarian catalogs must have exactly the English keys and placeholders (checked
  by tests). `createTranslator` (`@devquake/ui`) handles `{name}` placeholders and plurals
  (`Intl.PluralRules`). Server code uses the host's `getT()`; client components get the
  catalog from `I18nProvider` and use `useT()`.
- **Links and redirects keep the language**: internal links use `Link` from `@devquake/ui`
  (prefixes root-relative paths with the current language; `/api` and `/admin-cp` never), and
  server redirects use `localizePath()`.
- **Apps** get the language as `ctx.locale` (additive, optional SDK field; `en` on older
  hosts) and ship their own catalogs.
- **Dates and numbers** are formatted in the page language (`formatDateTime(value, zone,
style, locale)`), still in the viewer's time zone (ADR 0010).
- **Emails** go out in the recipient's language: `users.locale` (migration 0016) records the
  language a member last used; emails to people without an account use the page's language.
  Internal emails to the owner stay English.
- **SEO**: `<html lang>` follows the page; every public page lists its language versions
  (`hreflang`, with `x-default` = English), and `sitemap.xml` lists every language version of
  each public page with its alternates.
- **Legal texts**: the privacy policy is translated, and every language version is equally
  valid. The translations must be reviewed by a qualified person before they are relied on.

## Consequences

- Every user-facing string must come from a catalog; adding a text means adding it in four
  languages (tests fail on missing keys).
- Internal links must not use `next/link` directly outside `/admin-cp`.
- The Next.js router never sees the prefix, so `usePathname()` returns the browser path
  (`/de/ideas`); code that compares paths uses `stripLocale()`.
