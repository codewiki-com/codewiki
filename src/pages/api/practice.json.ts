/** `/api/practice.json` — the answer-free catalogue used by practice discovery clients. */
import type { APIRoute } from 'astro';

import { json } from '@/lib/api';
import { listPracticeItems } from '@/lib/practice';

export const GET = (async () =>
  json({ generatedAt: new Date().toISOString(), items: await listPracticeItems() })) satisfies APIRoute;
