import { z } from 'astro/zod';

/**
 * A string in both site locales. Every reader-facing string in a data collection is bilingual,
 * so this shape is shared by the glossary, quiz and path schemas.
 */
export const localized = z.object({ en: z.string().min(1), zh: z.string().min(1) });

export type Localized = z.infer<typeof localized>;

/** `track/slug`, the shape of a cross-reference to a topic (both languages of it). */
export const topicRef = z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/);

/** A lowercase slug: the shape of a track, section, glossary or path id. */
export const slug = z.string().regex(/^[a-z0-9-]+$/);
