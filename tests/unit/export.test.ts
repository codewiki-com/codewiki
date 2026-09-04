import { clearAll, exportAll, importAll, InvalidBackup, storeKeys, type Backup } from '@/lib/export';
import { KEYS } from '@/lib/prefs';

/** Minimal in-memory `Storage`; `key`/`length` are what the prefix sweep walks. */
function fakeStorage(entries: Record<string, string> = {}): Storage {
  const map = new Map<string, string>(Object.entries(entries));
  return {
    get length() {
      return map.size;
    },
    key: (index: number) => [...map.keys()][index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    clear: () => map.clear(),
  };
}

const prefs = { theme: 'dark', depth: 'deep' };
const progress = { topics: { 'python/closures': { readPct: 40, lastAt: '2026-09-03T10:00:00Z' } } };

function seeded(): Storage {
  return fakeStorage({
    [KEYS.prefs]: JSON.stringify(prefs),
    [KEYS.progress]: JSON.stringify(progress),
    'unrelated:key': 'kept',
  });
}

describe('storeKeys', () => {
  it('finds every codewiki key and nothing else', () => {
    expect(storeKeys(seeded()).sort()).toEqual([KEYS.prefs, KEYS.progress]);
  });
});

describe('exportAll', () => {
  it('writes a versioned, dated backup of the parsed values', () => {
    const backup = exportAll(seeded());
    expect(backup.version).toBe(1);
    expect(Number.isNaN(Date.parse(backup.exportedAt))).toBe(false);
    expect(backup.data).toEqual({ [KEYS.prefs]: prefs, [KEYS.progress]: progress });
  });

  it('leaves keys that are not ours out of the file', () => {
    expect(Object.keys(exportAll(seeded()).data)).not.toContain('unrelated:key');
  });

  it('keeps a value that is not JSON as the raw string rather than dropping it', () => {
    const backup = exportAll(fakeStorage({ 'cw:v1:odd': 'not json' }));
    expect(backup.data['cw:v1:odd']).toBe('not json');
  });

  it('exports an empty store as an empty data object', () => {
    expect(exportAll(fakeStorage()).data).toEqual({});
  });
});

describe('importAll', () => {
  const backup: Backup = {
    version: 1,
    exportedAt: '2026-09-03T00:00:00.000Z',
    data: { [KEYS.prefs]: { depth: 'quick' } },
  };

  it('merges into each existing object key and keeps the keys the file does not mention', () => {
    const storage = seeded();
    importAll(storage, backup, 'merge');

    // `theme` survives the merge, `depth` is taken from the file.
    expect(JSON.parse(storage.getItem(KEYS.prefs)!)).toEqual({ theme: 'dark', depth: 'quick' });
    expect(JSON.parse(storage.getItem(KEYS.progress)!)).toEqual(progress);
  });

  it('replaces the whole store, dropping keys the file does not mention', () => {
    const storage = seeded();
    importAll(storage, backup, 'replace');

    expect(JSON.parse(storage.getItem(KEYS.prefs)!)).toEqual({ depth: 'quick' });
    expect(storage.getItem(KEYS.progress)).toBeNull();
    // Keys that are not ours were never the backup's business.
    expect(storage.getItem('unrelated:key')).toBe('kept');
  });

  it('overwrites rather than merges when the incoming value is not an object', () => {
    const storage = fakeStorage({ 'cw:v1:recents': JSON.stringify({ pages: ['a'] }) });
    importAll(storage, { version: 1, exportedAt: '', data: { 'cw:v1:recents': 'plain' } }, 'merge');
    expect(storage.getItem('cw:v1:recents')).toBe('"plain"');
  });

  it('ignores keys outside the codewiki prefix', () => {
    const storage = fakeStorage();
    importAll(storage, { version: 1, exportedAt: '', data: { evil: 1 } }, 'replace');
    expect(storage.getItem('evil')).toBeNull();
  });

  it('rejects anything that is not a version 1 backup', () => {
    const storage = seeded();
    for (const payload of [
      null,
      'nope',
      [],
      {},
      { version: 2, data: {} },
      { version: 1 },
      { version: 1, data: [] },
    ]) {
      expect(() => importAll(storage, payload, 'merge')).toThrow(InvalidBackup);
    }
    // A rejected import changes nothing.
    expect(JSON.parse(storage.getItem(KEYS.prefs)!)).toEqual(prefs);
  });

  it('round-trips an export back into an empty store', () => {
    const storage = fakeStorage();
    importAll(storage, exportAll(seeded()), 'replace');
    expect(JSON.parse(storage.getItem(KEYS.progress)!)).toEqual(progress);
  });
});

describe('clearAll', () => {
  it('removes every codewiki key and leaves the rest alone', () => {
    const storage = seeded();
    clearAll(storage);
    expect(storeKeys(storage)).toEqual([]);
    expect(storage.getItem('unrelated:key')).toBe('kept');
  });
});
