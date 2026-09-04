/** `/rss.xml` — the English feed. Its Chinese twin is `/zh/rss.xml`. */
import type { APIRoute } from 'astro';

import { feed } from '@/lib/feed';

export const GET = (({ site }) => feed('en', site)) satisfies APIRoute;
