import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  bookTitles,
  checkLinks,
  extractLinks,
  linkIssues,
  type LinkStatus,
} from '../../../scripts/content/lib/links';

/** A scripted `fetchImpl`: per-URL status per method, or `'throw'` for a network error. */
type Route = number | 'throw' | { HEAD: number | 'throw'; GET: number | 'throw' };

function fakeFetch(routes: Record<string, Route>, delayMs = 0) {
  const calls: { url: string; method: string; headers: Record<string, string> }[] = [];
  let live = 0;
  let peak = 0;
  const impl = async (url: string, init: RequestInit = {}): Promise<Response> => {
    const method = (init.method ?? 'GET').toUpperCase();
    const headers = (init.headers ?? {}) as Record<string, string>;
    calls.push({ url, method, headers });
    live += 1;
    peak = Math.max(peak, live);
    try {
      if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
      const route = routes[url];
      if (route === undefined) throw new Error(`unrouted ${url}`);
      const status = typeof route === 'object' ? route[method as 'HEAD' | 'GET'] : route;
      if (status === 'throw') throw new Error('network down');
      // 204/205/304 forbid a body, and HEAD never has one.
      const bodyless = method === 'HEAD' || [204, 205, 304].includes(status);
      return new Response(bodyless ? null : 'body', { status });
    } finally {
      live -= 1;
    }
  };
  return { impl, calls, peak: () => peak };
}

/** Path to a cache file inside a directory that does not exist yet. */
async function cacheFile(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'links-test-'));
  return path.join(dir, 'nested', 'link-cache.json');
}

/** Path to a cache file pre-loaded with `entries` (or raw text, to test corruption). */
async function seededCache(entries: Record<string, LinkStatus> | string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'links-test-'));
  const file = path.join(dir, 'link-cache.json');
  await writeFile(file, typeof entries === 'string' ? entries : JSON.stringify(entries), 'utf8');
  return file;
}

const DAY = 24 * 60 * 60 * 1000;

describe('extractLinks', () => {
  it('reads inline links, autolinks and bare urls with 1-based lines', () => {
    const md = [
      'See [the docs](https://a.example/docs) first.',
      '',
      'Or <https://b.example/x> or just https://c.example/y today.',
    ].join('\n');
    expect(extractLinks(md)).toEqual([
      { url: 'https://a.example/docs', line: 1, text: 'the docs' },
      { url: 'https://b.example/x', line: 3, text: 'https://b.example/x' },
      { url: 'https://c.example/y', line: 3, text: 'https://c.example/y' },
    ]);
  });

  it('skips fenced code and inline code', () => {
    const md = [
      '```sh',
      'curl https://fenced.example/a',
      '```',
      'Use `https://inline.example/b` never.',
      'But https://prose.example/c counts.',
    ].join('\n');
    expect(extractLinks(md).map((link) => link.url)).toEqual(['https://prose.example/c']);
  });

  it('dedupes by url keeping the first line', () => {
    const md = ['a https://x.example/1', 'b https://x.example/1', '[x]: https://x.example/1'].join('\n');
    expect(extractLinks(md)).toEqual([{ url: 'https://x.example/1', line: 1, text: 'https://x.example/1' }]);
  });

  it('keeps reference definitions that are not duplicated inline', () => {
    expect(extractLinks('[mdn]: https://mdn.example/ref').map((link) => link.url)).toEqual([
      'https://mdn.example/ref',
    ]);
  });

  it('strips trailing punctuation from bare urls', () => {
    const md = [
      'One https://a.example/p.',
      'Two https://b.example/p,',
      'Three (https://c.example/p)',
      '四 https://d.example/p。',
      '五 https://e.example/p，',
      '六 （https://f.example/p）',
    ].join('\n');
    expect(extractLinks(md).map((link) => link.url)).toEqual([
      'https://a.example/p',
      'https://b.example/p',
      'https://c.example/p',
      'https://d.example/p',
      'https://e.example/p',
      'https://f.example/p',
    ]);
  });

  it('keeps balanced parentheses inside urls', () => {
    const md = 'A [t](https://w.example/wiki/Foo_(bar)) and https://w.example/wiki/Baz_(qux) end.';
    expect(extractLinks(md).map((link) => link.url)).toEqual([
      'https://w.example/wiki/Foo_(bar)',
      'https://w.example/wiki/Baz_(qux)',
    ]);
  });

  it('skips yaml frontmatter but keeps absolute line numbers', () => {
    const md = [
      '---',
      'title: Topic',
      'canonical: https://meta.example/topic',
      '---',
      '',
      'Body https://body.example/x here.',
    ].join('\n');
    expect(extractLinks(md)).toEqual([
      { url: 'https://body.example/x', line: 6, text: 'https://body.example/x' },
    ]);
  });

  it('ignores relative links, anchors and link titles', () => {
    const md = 'See [a](/topics/x), [b](#anchor) and [c](https://t.example/z "Title").';
    expect(extractLinks(md).map((link) => link.url)).toEqual(['https://t.example/z']);
  });

  it('reads image targets', () => {
    expect(extractLinks('![alt text](https://img.example/a.png)')).toEqual([
      { url: 'https://img.example/a.png', line: 1, text: 'alt text' },
    ]);
  });
});

describe('bookTitles', () => {
  const md = [
    '# Topic',
    '',
    'Read _Not A Book_ here, and 《不是书》 too.',
    '',
    '## Further reading',
    '',
    '- 《深入理解计算机系统》',
    '- _Designing Data-Intensive Applications_',
    '- *Refactoring*',
    '- Clean Code by Robert C. Martin',
    '- [A linked post](https://blog.example/post)',
    '',
    '## Next section',
    '',
    '- _Still not flagged_',
  ].join('\n');

  it('flags emphasised and bracketed titles only inside the matching section', () => {
    expect(bookTitles(md)).toEqual([
      { line: 7, title: '深入理解计算机系统' },
      { line: 8, title: 'Designing Data-Intensive Applications' },
      { line: 9, title: 'Refactoring' },
      { line: 10, title: 'Clean Code by Robert C. Martin' },
    ]);
  });

  it('matches only anchored further-reading headings', () => {
    const section = ['', '- 《书名》'];
    expect(bookTitles(['## 延伸阅读', ...section].join('\n'))).toEqual([{ line: 3, title: '书名' }]);
    expect(bookTitles(['## 2. Further Reading', ...section].join('\n'))).toEqual([
      { line: 3, title: '书名' },
    ]);
    expect(bookTitles(['## 参考资源', ...section].join('\n'))).toEqual([{ line: 3, title: '书名' }]);
    for (const heading of ['## Rvalue References', '## Circular References', '## 快速参考表']) {
      expect(bookTitles([heading, ...section].join('\n'))).toEqual([]);
    }
  });

  it('leaves entries that carry a link or a url to the link checker', () => {
    const md = [
      '## Further reading',
      '',
      '- [Total TypeScript](https://tt.example/) - courses by Matt Pocock',
      '- _Refactoring_ https://refactoring.example/',
      '- ![cover](https://img.example/c.png) *Clean Code*',
      '- 《深入理解计算机系统》',
    ].join('\n');
    expect(bookTitles(md)).toEqual([{ line: 6, title: '深入理解计算机系统' }]);
  });

  it('recognises the Chinese and reference headings', () => {
    for (const heading of ['## 延伸阅读', '## References', '## 参考资料', '### FURTHER READING']) {
      expect(bookTitles([heading, '', '- 《书名》'].join('\n'))).toEqual([{ line: 3, title: '书名' }]);
    }
  });

  it('ignores fenced code inside the section', () => {
    const md = ['## References', '', '```md', '- 《书名》', '```', ''].join('\n');
    expect(bookTitles(md)).toEqual([]);
  });

  it('does not flag prose without a title marker', () => {
    const md = ['## Further reading', '', 'The list below is maintained by hand.', '- plain item'].join('\n');
    expect(bookTitles(md)).toEqual([]);
  });
});

describe('checkLinks', () => {
  it('reports ok, dead and unreachable urls', async () => {
    const fetcher = fakeFetch({
      'https://ok.example/': 200,
      'https://moved.example/': 301,
      'https://gone.example/': 404,
      'https://down.example/': 'throw',
    });
    const statuses = await checkLinks(
      ['https://ok.example/', 'https://moved.example/', 'https://gone.example/', 'https://down.example/'],
      { fetchImpl: fetcher.impl, retryDelayMs: 0, cachePath: await cacheFile() },
    );
    expect(statuses.get('https://ok.example/')).toMatchObject({ status: 200, ok: true, via: 'HEAD' });
    expect(statuses.get('https://moved.example/')).toMatchObject({ status: 301, ok: true });
    expect(statuses.get('https://gone.example/')).toMatchObject({ status: 404, ok: false });
    expect(statuses.get('https://down.example/')).toMatchObject({ status: 'error', ok: false, via: 'GET' });
    expect(statuses.get('https://ok.example/')?.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('falls back to GET when HEAD is refused', async () => {
    const fetcher = fakeFetch({
      'https://a.example/': { HEAD: 405, GET: 200 },
      'https://b.example/': { HEAD: 403, GET: 200 },
      'https://c.example/': { HEAD: 'throw', GET: 204 },
    });
    const statuses = await checkLinks(['https://a.example/', 'https://b.example/', 'https://c.example/'], {
      fetchImpl: fetcher.impl,
      concurrency: 1,
      retryDelayMs: 0,
      cachePath: await cacheFile(),
    });
    expect(statuses.get('https://a.example/')).toMatchObject({ status: 200, ok: true, via: 'GET' });
    expect(statuses.get('https://b.example/')).toMatchObject({ status: 200, ok: true, via: 'GET' });
    expect(statuses.get('https://c.example/')).toMatchObject({ status: 204, ok: true, via: 'GET' });
    expect(fetcher.calls.map((call) => call.method)).toEqual([
      'HEAD',
      'GET',
      'HEAD',
      'GET',
      'HEAD',
      'HEAD',
      'GET',
    ]);
  });

  it('retries a network error once before falling back to GET', async () => {
    const calls: string[] = [];
    const impl = async (_url: string, init: RequestInit): Promise<Response> => {
      calls.push(init.method ?? 'GET');
      if (calls.length === 1) throw new Error('connection reset');
      return new Response(null, { status: 200 });
    };

    const statuses = await checkLinks(['https://flaky.example/'], {
      fetchImpl: impl,
      retryDelayMs: 0,
      cachePath: await cacheFile(),
    });

    expect(calls).toEqual(['HEAD', 'HEAD']);
    expect(statuses.get('https://flaky.example/')).toMatchObject({ status: 200, ok: true, via: 'HEAD' });
  });

  it('keeps 404 dead and treats 403 as reachable but restricted', async () => {
    const fetcher = fakeFetch({ 'https://gone.example/': 404, 'https://restricted.example/': 403 });
    const statuses = await checkLinks(['https://gone.example/', 'https://restricted.example/'], {
      fetchImpl: fetcher.impl,
      cachePath: await cacheFile(),
    });

    expect(statuses.get('https://gone.example/')).toMatchObject({
      status: 404,
      ok: false,
      restricted: false,
    });
    expect(statuses.get('https://restricted.example/')).toMatchObject({
      status: 403,
      ok: true,
      restricted: true,
    });
    expect(linkIssues('See https://restricted.example/.', statuses)).toEqual([]);
  });

  it('retries 429 and 503 once, then classifies their final responses', async () => {
    const fetcher = fakeFetch({ 'https://busy.example/': 429, 'https://down.example/': 503 });
    const statuses = await checkLinks(['https://busy.example/', 'https://down.example/'], {
      fetchImpl: fetcher.impl,
      concurrency: 1,
      retryDelayMs: 0,
      cachePath: await cacheFile(),
    });

    expect(fetcher.calls.map((call) => call.method)).toEqual(['HEAD', 'HEAD', 'HEAD', 'HEAD']);
    expect(statuses.get('https://busy.example/')).toMatchObject({
      status: 429,
      ok: true,
      restricted: true,
    });
    expect(statuses.get('https://down.example/')).toMatchObject({
      status: 503,
      ok: false,
      restricted: false,
    });
  });

  it('sends browser-like default headers and permits a configured user agent', async () => {
    const fetcher = fakeFetch({ 'https://ok.example/': 200 });
    await checkLinks(['https://ok.example/'], {
      fetchImpl: fetcher.impl,
      cachePath: await cacheFile(),
      userAgent: 'test-agent/9',
    });
    expect(fetcher.calls[0].headers).toMatchObject({
      'User-Agent': 'test-agent/9',
      Accept: expect.stringContaining('text/html'),
    });

    const defaults = fakeFetch({ 'https://default.example/': 200 });
    await checkLinks(['https://default.example/'], {
      fetchImpl: defaults.impl,
      cachePath: await cacheFile(),
    });
    expect(defaults.calls[0].headers['User-Agent']).toMatch(/^Mozilla\/5\.0/);
  });

  it('serves fresh cache entries without fetching', async () => {
    const now = Date.parse('2026-09-03T00:00:00.000Z');
    const cachePath = await seededCache({
      'https://cached.example/': {
        status: 200,
        ok: true,
        checkedAt: new Date(now - 6 * DAY).toISOString(),
        via: 'HEAD',
      },
    });
    const fetcher = fakeFetch({});
    const statuses = await checkLinks(['https://cached.example/'], {
      fetchImpl: fetcher.impl,
      cachePath,
      now: () => now,
    });
    expect(fetcher.calls).toEqual([]);
    expect(statuses.get('https://cached.example/')).toMatchObject({ status: 200, ok: true, via: 'cache' });
  });

  it('serves a fresh restricted verdict from cache as reachable', async () => {
    const now = Date.parse('2026-09-03T00:00:00.000Z');
    const cachePath = await seededCache({
      'https://restricted.example/': {
        status: 403,
        ok: false,
        checkedAt: new Date(now - 6 * DAY).toISOString(),
        via: 'HEAD',
      },
    });
    const fetcher = fakeFetch({});
    const statuses = await checkLinks(['https://restricted.example/'], {
      fetchImpl: fetcher.impl,
      cachePath,
      now: () => now,
    });

    expect(fetcher.calls).toEqual([]);
    expect(statuses.get('https://restricted.example/')).toMatchObject({
      status: 403,
      ok: true,
      restricted: true,
      via: 'cache',
    });
  });

  it('refetches entries older than seven days', async () => {
    const now = Date.parse('2026-09-03T00:00:00.000Z');
    const cachePath = await seededCache({
      'https://stale.example/': {
        status: 200,
        ok: true,
        checkedAt: new Date(now - 8 * DAY).toISOString(),
        via: 'HEAD',
      },
    });
    const fetcher = fakeFetch({ 'https://stale.example/': 404 });
    const statuses = await checkLinks(['https://stale.example/'], {
      fetchImpl: fetcher.impl,
      cachePath,
      now: () => now,
    });
    expect(fetcher.calls).toHaveLength(1);
    expect(statuses.get('https://stale.example/')).toMatchObject({ status: 404, ok: false });
    expect(statuses.get('https://stale.example/')?.checkedAt).toBe(new Date(now).toISOString());
  });

  it('writes results back to the cache file, creating its directory', async () => {
    const cachePath = await cacheFile();
    const fetcher = fakeFetch({ 'https://ok.example/': 200 });
    await checkLinks(['https://ok.example/'], { fetchImpl: fetcher.impl, cachePath });
    const written = JSON.parse(await readFile(cachePath, 'utf8'));
    expect(written['https://ok.example/']).toMatchObject({ status: 200, ok: true, via: 'HEAD' });
  });

  it('tolerates a corrupt cache file', async () => {
    const cachePath = await seededCache('{ not json');
    const fetcher = fakeFetch({ 'https://ok.example/': 200 });
    const statuses = await checkLinks(['https://ok.example/'], { fetchImpl: fetcher.impl, cachePath });
    expect(statuses.get('https://ok.example/')?.ok).toBe(true);
  });

  it('dedupes urls, keeps input order and honours the concurrency limit', async () => {
    const urls = Array.from({ length: 9 }, (_, i) => `https://n${i}.example/`);
    const routes = Object.fromEntries(urls.map((url) => [url, 200]));
    const fetcher = fakeFetch(routes, 5);
    const statuses = await checkLinks([...urls, ...urls], {
      fetchImpl: fetcher.impl,
      concurrency: 3,
      cachePath: await cacheFile(),
    });
    expect([...statuses.keys()]).toEqual(urls);
    expect(fetcher.calls).toHaveLength(urls.length);
    expect(fetcher.peak()).toBeLessThanOrEqual(3);
  });

  it('never throws when a single url fails', async () => {
    const fetcher = fakeFetch({ 'https://ok.example/': 200, 'https://bad.example/': 'throw' });
    const statuses = await checkLinks(['https://bad.example/', 'https://ok.example/'], {
      fetchImpl: fetcher.impl,
      retryDelayMs: 0,
      cachePath: await cacheFile(),
    });
    expect(statuses.get('https://ok.example/')?.ok).toBe(true);
    expect(statuses.get('https://bad.example/')?.ok).toBe(false);
  });

  it('gives up on a hanging request after the timeout', async () => {
    const impl = (_url: string, init: RequestInit = {}): Promise<Response> =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });
    const statuses = await checkLinks(['https://slow.example/'], {
      fetchImpl: impl,
      timeoutMs: 20,
      retryDelayMs: 0,
      cachePath: await cacheFile(),
    });
    expect(statuses.get('https://slow.example/')).toMatchObject({ status: 'error', ok: false });
  });
});

describe('linkIssues', () => {
  it('reports dead links and unverified books in line order', async () => {
    const md = [
      '# Topic',
      '',
      'Alive: https://ok.example/ and dead: https://gone.example/.',
      '',
      '## Further reading',
      '',
      '- 《深入理解计算机系统》',
    ].join('\n');
    const fetcher = fakeFetch({ 'https://ok.example/': 200, 'https://gone.example/': 404 });
    const statuses = await checkLinks(
      extractLinks(md).map((link) => link.url),
      { fetchImpl: fetcher.impl, cachePath: await cacheFile() },
    );
    expect(linkIssues(md, statuses)).toEqual([
      { line: 3, rule: 'dead-link', message: expect.stringContaining('404'), url: 'https://gone.example/' },
      { line: 7, rule: 'unverified-book', message: expect.stringContaining('深入理解计算机系统') },
    ]);
  });

  it('stays silent for urls that were never checked', () => {
    expect(linkIssues('See https://unchecked.example/ here.', new Map())).toEqual([]);
  });
});
