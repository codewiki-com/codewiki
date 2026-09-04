import { groupResults, pushRecent, recentPages, safeExcerpt, RECENTS_LIMIT } from '@/lib/search';
import { KEYS } from '@/lib/prefs';

/** Minimal in-memory `Storage`, so the palette helpers have something to talk to. */
function fakeStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    key: (index: number) => [...entries.keys()][index] ?? null,
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => void entries.set(key, value),
    removeItem: (key: string) => void entries.delete(key),
    clear: () => entries.clear(),
  };
}

/** One Pagefind `data()` payload, reduced to the fields the palette reads. */
function result(url: string, type?: string) {
  return { url, meta: type ? { title: url, type } : { title: url } };
}

describe('groupResults', () => {
  it('files each result under the group its type names', () => {
    const grouped = groupResults([
      result('/python/closures/', 'topic'),
      result('/glossary/closure/', 'glossary'),
      result('/paths/python-from-zero/', 'path'),
      result('/cheatsheets/python/', 'cheatsheet'),
    ]);

    expect(grouped.topics.map((r) => r.url)).toEqual(['/python/closures/']);
    expect(grouped.glossary.map((r) => r.url)).toEqual(['/glossary/closure/']);
    expect(grouped.paths.map((r) => r.url)).toEqual(['/paths/python-from-zero/']);
    expect(grouped.other.map((r) => r.url)).toEqual(['/cheatsheets/python/']);
  });

  it('keeps Pagefind’s ranking inside a group', () => {
    const grouped = groupResults([result('/a/', 'topic'), result('/b/', 'glossary'), result('/c/', 'topic')]);
    expect(grouped.topics.map((r) => r.url)).toEqual(['/a/', '/c/']);
  });

  it('treats a result with no type as ungrouped rather than dropping it', () => {
    const grouped = groupResults([result('/search/'), { url: '/x/' }]);
    expect(grouped.other.map((r) => r.url)).toEqual(['/search/', '/x/']);
    expect(grouped.topics).toEqual([]);
  });

  it('returns every group even when nothing matched', () => {
    expect(groupResults([])).toEqual({ topics: [], glossary: [], paths: [], other: [] });
  });
});

describe('recents', () => {
  it('starts empty and survives a malformed value', () => {
    const store = fakeStorage();
    expect(recentPages(store)).toEqual([]);

    store.setItem(KEYS.recents, '{ not json');
    expect(recentPages(store)).toEqual([]);

    store.setItem(KEYS.recents, JSON.stringify({ pages: [{ url: 5 }, null, { title: 'no url' }] }));
    expect(recentPages(store)).toEqual([]);
  });

  it('puts the newest page first', () => {
    const store = fakeStorage();
    pushRecent(store, '/python/closures/', 'Closures');
    pushRecent(store, '/javascript/event-loop/', 'The event loop');

    expect(recentPages(store).map((page) => page.url)).toEqual([
      '/javascript/event-loop/',
      '/python/closures/',
    ]);
    expect(recentPages(store)[0]?.title).toBe('The event loop');
  });

  it('moves a page already listed back to the front instead of duplicating it', () => {
    const store = fakeStorage();
    pushRecent(store, '/a/', 'A');
    pushRecent(store, '/b/', 'B');
    const pages = pushRecent(store, '/a/', 'A renamed');

    expect(pages.map((page) => page.url)).toEqual(['/a/', '/b/']);
    expect(pages[0]?.title).toBe('A renamed');
  });

  it('keeps only the eight most recent pages', () => {
    const store = fakeStorage();
    for (let n = 1; n <= RECENTS_LIMIT + 3; n += 1) pushRecent(store, `/p${n}/`, `P${n}`);

    const pages = recentPages(store);
    expect(pages).toHaveLength(RECENTS_LIMIT);
    expect(pages[0]?.url).toBe(`/p${RECENTS_LIMIT + 3}/`);
    expect(pages.at(-1)?.url).toBe('/p4/');
  });

  it('stamps each entry with the time it was opened', () => {
    const store = fakeStorage();
    const at = new Date('2026-09-03T10:00:00.000Z');
    expect(pushRecent(store, '/a/', 'A', at)[0]?.at).toBe('2026-09-03T10:00:00.000Z');
  });

  it('writes under the recents key', () => {
    const store = fakeStorage();
    pushRecent(store, '/a/', 'A', new Date('2026-09-03T10:00:00.000Z'));
    expect(JSON.parse(store.getItem(KEYS.recents) ?? 'null')).toEqual({
      pages: [{ url: '/a/', title: 'A', at: '2026-09-03T10:00:00.000Z' }],
    });
  });

  it('degrades quietly when storage is missing or refuses to write', () => {
    const broken: Storage = {
      ...fakeStorage(),
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };

    expect(recentPages(null)).toEqual([]);
    expect(recentPages(broken)).toEqual([]);

    // The write is lost, but the caller still gets the list to render for this session.
    expect(pushRecent(null, '/a/', 'A').map((page) => page.url)).toEqual(['/a/']);
    expect(pushRecent(broken, '/a/', 'A').map((page) => page.url)).toEqual(['/a/']);
  });
});

describe('safeExcerpt', () => {
  it('keeps the highlight Pagefind added', () => {
    expect(safeExcerpt('a <mark>closure</mark> is')).toBe('a <mark>closure</mark> is');
    expect(safeExcerpt('nothing matched')).toBe('nothing matched');
    expect(safeExcerpt('')).toBe('');
  });

  it('escapes the page text around it', () => {
    // Pagefind escapes nothing, so a topic that shows this as an example would otherwise run it.
    expect(safeExcerpt('<img src=x onerror="alert(1)">')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
    );
    expect(safeExcerpt("a <mark>&</mark> b <script>'x'</script>")).toBe(
      'a <mark>&amp;</mark> b &lt;script&gt;&#39;x&#39;&lt;/script&gt;',
    );
  });

  it('escapes an ampersand once, not twice', () => {
    expect(safeExcerpt('&lt; stays literal')).toBe('&amp;lt; stays literal');
  });
});
