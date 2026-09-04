import { normalizeLang, type RunLang } from '@/lib/runners/protocol';
import { parseFenceMeta } from '@/markdown/shiki-meta';

const FENCE = /^ {0,3}(`{3,}|~{3,})([^\r\n]*)\r?\n([\s\S]*?)^ {0,3}\1[ \t]*$/gm;

export interface RunnableFence {
  lang: RunLang;
  title?: string;
  code: string;
  tests?: string;
  seed?: string;
}

interface Fence {
  lang: RunLang | null;
  code: string;
  meta: ReturnType<typeof parseFenceMeta>;
}

/** Runnable fences plus any page-local SQL seed they reference, in authored order. */
export function runnableFences(source: string): RunnableFence[] {
  const fences: Fence[] = [...source.matchAll(FENCE)].map((match) => {
    const rawMeta = (match[2] ?? '').trim();
    return {
      lang: normalizeLang(rawMeta.split(/\s+/, 1)[0] ?? ''),
      code: (match[3] ?? '').replace(/\r?\n$/, ''),
      meta: parseFenceMeta(rawMeta),
    };
  });
  const seeds = new Map<string, string>();
  for (const fence of fences) {
    if (fence.lang !== 'sql' || fence.meta.run || !fence.meta.seed || seeds.has(fence.meta.seed)) continue;
    seeds.set(fence.meta.seed, fence.code);
  }

  return fences.flatMap((fence) => {
    if (!fence.lang || !fence.meta.run) return [];
    const seed = fence.lang === 'sql' && fence.meta.seed ? seeds.get(fence.meta.seed) : undefined;
    return [
      {
        lang: fence.lang,
        code: fence.code,
        ...(fence.meta.title ? { title: fence.meta.title } : {}),
        ...(fence.meta.tests ? { tests: fence.meta.tests } : {}),
        ...(seed !== undefined ? { seed } : {}),
      },
    ];
  });
}
