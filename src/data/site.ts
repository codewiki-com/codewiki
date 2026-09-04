// Site-wide constants. Kept dependency-free (type-only import) so scripts and tests can import it.

import type { L } from './tracks';

export const SITE = {
  name: 'codewiki',
  /** Canonical origin, no trailing slash — canonical URLs, sitemap and OG images build on it. */
  url: 'https://codewiki.com',
  tagline: { en: 'Master code in the AI era', zh: '在 AI 时代精通编程' } satisfies L,
  /** Source repository; powers the "Edit on GitHub" links. Placeholder until the repo is public. */
  repo: 'https://github.com/codewiki-dev/codewiki',
} as const;

/** Paths, Practice and Cheatsheets are public after the P2a learning-layer wave. */
export const P2_NAV = true;

/** Task 13 exposes the Playground after its static page and runtimes land. */
export const P2B_NAV = false;

/** Compare belongs to P3 and remains hidden until its routes exist. */
export const P3_NAV = false;

/** Task 14 turns on the downloadable rules-pack card once its endpoints exist. */
export const P2_RULES = false;

// Task 13: append-only release switch for the playground route.
export const P2B_NAV_TASK_13 = true;
