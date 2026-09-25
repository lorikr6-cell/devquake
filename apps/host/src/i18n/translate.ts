import { DEFAULT_LOCALE, createTranslator, type Locale, type Translate } from '@devquake/ui';
import { catalog } from './catalog';

/** t('area.key', params) in `locale` (English for missing keys). Pure: no request needed. */
export function translatorFor(locale: Locale, namespace?: string): Translate {
  const t = createTranslator(locale, catalog(locale), catalog(DEFAULT_LOCALE));
  return namespace ? (key, params) => t(`${namespace}.${key}`, params) : t;
}
