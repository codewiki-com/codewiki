// Head model and JSON-LD builders. Pure data: no Astro imports, so it is unit-testable and
// reusable from build scripts. `<Seo>` turns the returned model into tags verbatim.

import { SITE } from '@/data/site';
import { t } from '@/i18n';
import { alternates, localizePath, stripLocale, type Locale } from '@/lib/urls';

/** Page archetypes. They pick the title shape, `og:type` and the automatic JSON-LD. */
export type PageKind = 'home' | 'track' | 'topic' | 'glossary' | 'practice' | 'page';

export interface HeadInput {
  locale: Locale;
  /** Site-absolute path of the page being rendered, locale prefix included, with trailing slash. */
  path: string;
  title: string;
  description: string;
  kind: PageKind;
  /** Track or section name, rendered as the middle title segment. Omit to drop that segment. */
  trackName?: string;
  /** Overrides the generated OG image. Site-absolute path or an absolute URL. */
  ogImagePath?: string;
  noindex?: boolean;
  /** Page-specific JSON-LD blocks, appended after the automatic ones. */
  jsonLd?: object[];
}

export interface HeadModel {
  title: string;
  description: string;
  canonical: string;
  alternates: { hreflang: string; href: string }[];
  og: Record<string, string>;
  twitter: Record<string, string>;
  jsonLd: object[];
  /** Only set when the page opts out of indexing. Such a page also has no `alternates`. */
  robots?: string;
}

/** Title separator: middle dot in English, fullwidth bar in Chinese. */
const TITLE_SEPARATOR: Record<Locale, string> = { en: ' · ', zh: '｜' };

const OG_LOCALE: Record<Locale, string> = { en: 'en_US', zh: 'zh_CN' };

/** BCP-47 tags, matching the hreflang values. */
const LANG_TAG: Record<Locale, string> = { en: 'en', zh: 'zh-Hans' };

/** Absolute URL for a site-absolute path. Absolute inputs pass through untouched. */
function absolute(pathOrUrl: string): string {
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${SITE.url}${pathOrUrl}`;
}

/** `"{Title} · {Track} · codewiki"`, or the tagline line on the home page. */
export function formatTitle(input: Pick<HeadInput, 'locale' | 'kind' | 'title' | 'trackName'>): string {
  const { locale, kind, title, trackName } = input;
  if (kind === 'home') return `${SITE.name} · ${SITE.tagline[locale]}`;
  if (kind === 'practice') return [title, t(locale, 'practice.title'), SITE.name].join(' · ');
  return [title, trackName, SITE.name].filter(Boolean).join(TITLE_SEPARATOR[locale]);
}

/**
 * Default OG image URL. The generator writes one PNG per page under `/og`, with Chinese pages
 * living below `/og/zh`; the home page is `/og/home.png` because `/og/.png` is not a path.
 */
export function ogImageUrl(locale: Locale, path: string): string {
  const base = stripLocale(path).replace(/\/$/, '') || '/home';
  return `${SITE.url}/og${locale === 'zh' ? '/zh' : ''}${base}.png`;
}

/** Everything `<head>` needs for one page, ready to render without further logic. */
export function buildHead(input: HeadInput): HeadModel {
  const { locale, path, description, kind, ogImagePath, noindex, jsonLd = [] } = input;
  const title = formatTitle(input);
  const canonical = absolute(path);
  const alt = alternates(path);
  const image = ogImagePath ? absolute(ogImagePath) : ogImageUrl(locale, path);

  const og: Record<string, string> = {
    'og:type': kind === 'topic' ? 'article' : 'website',
    'og:site_name': SITE.name,
    'og:locale': OG_LOCALE[locale],
    'og:title': title,
    'og:description': description,
    'og:url': canonical,
    'og:image': image,
    'og:image:width': '1200',
    'og:image:height': '630',
  };

  const twitter: Record<string, string> = {
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': image,
  };

  const model: HeadModel = {
    title,
    description,
    canonical,
    // hreflang describes a set of pages that are alternatives of each other in search results.
    // A noindex page is in no such set, and Google ignores (and warns about) alternates that
    // point at, or come from, an unindexable URL — so an opted-out page emits none.
    alternates: noindex
      ? []
      : [
          { hreflang: 'en', href: absolute(alt.en) },
          { hreflang: 'zh-Hans', href: absolute(alt.zh) },
          { hreflang: 'x-default', href: absolute(alt.en) },
        ],
    og,
    twitter,
    jsonLd: [...(kind === 'home' ? [websiteLd(locale)] : []), ...jsonLd],
  };
  if (noindex) model.robots = 'noindex, nofollow';
  return model;
}

/** Site entry with the search box Google may surface. One per locale. */
export function websiteLd(locale: Locale): object {
  const search = `${SITE.url}${localizePath('/search/', locale)}?q={search_term_string}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: `${SITE.url}${localizePath('/', locale)}`,
    inLanguage: LANG_TAG[locale],
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: search },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Breadcrumb trail. Positions are 1-based, in the order given. */
export function breadcrumbLd(items: { name: string; url: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface TechArticleInput {
  headline: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified: string;
  inLanguage: string;
  keywords?: string[];
  section?: string;
}

/** Topic pages. Optional fields are dropped rather than emitted empty. */
export function techArticleLd(input: TechArticleInput): object {
  const { headline, description, url, datePublished, dateModified, inLanguage, keywords, section } = input;
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline,
    description,
    url,
    mainEntityOfPage: url,
    ...(datePublished ? { datePublished } : {}),
    dateModified,
    inLanguage,
    ...(keywords?.length ? { keywords } : {}),
    ...(section ? { articleSection: section } : {}),
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
  };
}

/** Track hubs, which read as a course made of their topics. */
export function courseLd(input: {
  name: string;
  description: string;
  url: string;
  inLanguage: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: input.name,
    description: input.description,
    url: input.url,
    inLanguage: input.inLanguage,
    provider: { '@type': 'Organization', name: SITE.name, url: SITE.url },
  };
}

/** A single glossary entry, linked back to the glossary it belongs to. */
export function definedTermLd(input: {
  name: string;
  description: string;
  url: string;
  inLanguage: string;
  termSetUrl: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: input.name,
    description: input.description,
    url: input.url,
    inLanguage: input.inLanguage,
    inDefinedTermSet: { '@type': 'DefinedTermSet', '@id': input.termSetUrl, url: input.termSetUrl },
  };
}

/** The glossary index itself, referenced by every term's `inDefinedTermSet`. */
export function definedTermSetLd(input: { name: string; url: string }): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': input.url,
    name: input.name,
    url: input.url,
  };
}
