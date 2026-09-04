/**
 * The palette's copy, resolved on the server.
 *
 * `Palette.tsx` never imports `@/i18n` — the locale is a page-level fact and the dictionaries have
 * no business in a client bundle — so both places that mount it (the layout, for the ⌘K dialog,
 * and `/search/`, for the inline results) build the same object from here.
 */
import type { PaletteLabels } from '@/islands/Palette';
import { t } from '@/i18n';
import type { Locale } from '@/lib/urls';

export function paletteLabels(locale: Locale): PaletteLabels {
  return {
    search: t(locale, 'nav.search'),
    placeholder: t(locale, 'search.placeholder'),
    results: t(locale, 'search.results'),
    recent: t(locale, 'search.recent'),
    empty: t(locale, 'search.empty'),
    searching: t(locale, 'search.searching'),
    groups: {
      topics: t(locale, 'search.topics'),
      glossary: t(locale, 'search.glossary'),
      paths: t(locale, 'search.paths'),
      other: t(locale, 'search.other'),
    },
    langFilter: t(locale, 'search.langFilter'),
    close: t(locale, 'search.closeLabel'),
    hintMove: t(locale, 'home.palette.move'),
    hintOpen: t(locale, 'home.palette.open'),
    hintClose: t(locale, 'search.hintClose'),
    offline: t(locale, 'home.palette.offline'),
    unavailable: t(locale, 'search.unavailable'),
    openPage: t(locale, 'search.openPage'),
  };
}
