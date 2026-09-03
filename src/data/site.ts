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
