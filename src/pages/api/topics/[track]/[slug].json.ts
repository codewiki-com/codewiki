/**
 * `/api/topics/{track}/{slug}.json` — the concept card: one topic, both languages, as a single
 * object. A pair is one card, so a client that wants the Chinese title of an English page reads
 * one file rather than two.
 *
 * The card is assembled in `getStaticPaths` and handed to `GET` as props, which keeps the route
 * one pass over the collections however many topics there are.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

import { isoDate, json, publicTopics, topicLinks } from '@/lib/api';
import { topicMeta, type Topic } from '@/lib/content';
import type { Locale } from '@/lib/urls';

/** A field that exists per locale. A missing twin leaves its side out entirely. */
type PerLocale = Partial<Record<Locale, string>>;

interface Card {
  id: string;
  title: PerLocale;
  description: PerLocale;
  track: string;
  section: string;
  difficulty: string;
  terms: { id: string; en: string; zh: string; short: { en: string; zh: string } }[];
  prerequisites: string[];
  related: string[];
  url: PerLocale;
  md: PerLocale;
  verified: { version: string; date: string };
  reviewed: string | null;
}

interface Props {
  card: Card;
}

export const getStaticPaths = (async () => {
  const glossary: CollectionEntry<'glossary'>[] = await getCollection('glossary');
  const topics = await publicTopics();
  const byTermId = new Map(glossary.map((term) => [term.id, term]));

  /** One bucket per pair, keyed `track/slug`; either twin may be missing. */
  const pairs = new Map<string, { track: string; slug: string; twins: Partial<Record<Locale, Topic>> }>();
  for (const topic of topics) {
    const { track, slug, lang } = topicMeta(topic);
    const id = `${track}/${slug}`;
    const pair = pairs.get(id) ?? { track, slug, twins: {} };
    pair.twins[lang] = topic;
    pairs.set(id, pair);
  }

  return [...pairs].map(([id, { track, slug, twins }]) => {
    // The English twin is the reference for the facts that are not language-specific; a topic
    // that only exists in Chinese speaks for itself.
    const primary = (twins.en ?? twins.zh)!;
    const data = primary.data;

    const title: PerLocale = {};
    const description: PerLocale = {};
    const url: PerLocale = {};
    const md: PerLocale = {};
    for (const lang of ['en', 'zh'] as const) {
      const twin = twins[lang];
      if (!twin) continue;
      title[lang] = twin.data.title;
      description[lang] = twin.data.description;
      const links = topicLinks(track, slug, lang);
      url[lang] = links.url;
      md[lang] = links.md;
    }

    const termIds: string[] = data.terms ?? [];

    const card: Card = {
      id,
      title,
      description,
      track,
      section: data.section,
      difficulty: data.difficulty,
      terms: termIds.flatMap((termId) => {
        const term = byTermId.get(termId);
        return term ? [{ id: term.id, en: term.data.en, zh: term.data.zh, short: term.data.short }] : [];
      }),
      prerequisites: data.prerequisites,
      related: data.related,
      url,
      md,
      verified: { version: data.verified.version, date: isoDate(data.verified.date) },
      reviewed: data.reviewed ? isoDate(data.reviewed) : null,
    };

    return { params: { track, slug }, props: { card } satisfies Props };
  });
}) satisfies GetStaticPaths;

export const GET = (({ props }) => json((props as Props).card)) satisfies APIRoute;
