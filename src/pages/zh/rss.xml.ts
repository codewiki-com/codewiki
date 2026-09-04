/** `/zh/rss.xml` — the Chinese feed. Its English twin is `/rss.xml`. */
import type { APIRoute } from 'astro';

import { feed } from '@/lib/feed';

export const GET = (({ site }) => feed('zh', site)) satisfies APIRoute;
