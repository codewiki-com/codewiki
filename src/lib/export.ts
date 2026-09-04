/**
 * Backup and restore of everything the visitor has accumulated — spec §6.2. Progress lives only in
 * this browser, so the settings page is the only way to move it to another one: `exportAll` writes
 * a single JSON file, `importAll` reads one back, `clearAll` empties the drawer.
 *
 * Pure: the store is a parameter, so the browser is not required and the rules below are
 * unit-tested directly. Every key the file touches carries the `cw:v1:` prefix — a backup can
 * neither read nor write anything else in the visitor's local storage.
 */

/** Namespace of every key this site owns. Matches `KEYS` in `prefs.ts`. */
export const STORE_PREFIX = 'cw:v1:';

/** Bumped only when the file format changes in a way an older reader cannot handle. */
export const BACKUP_VERSION = 1;

export interface Backup {
  version: typeof BACKUP_VERSION;
  /** ISO timestamp, so a visitor with several files can tell them apart. */
  exportedAt: string;
  /** One entry per stored key, values parsed rather than double-encoded. */
  data: Record<string, unknown>;
}

/** Merge keeps what this browser already has; replace makes it match the file. */
export type ImportMode = 'merge' | 'replace';

/** Thrown for a file that is not a backup, so the settings page can say so rather than crash. */
export class InvalidBackup extends Error {
  constructor(message = 'Not a codewiki backup file') {
    super(message);
    this.name = 'InvalidBackup';
  }
}

/** The slice of `Storage` this module uses; a plain object stands in for it in tests. */
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Every `cw:v1:` key currently in the store, in the order the store lists them. */
export function storeKeys(storage: StorageLike): string[] {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(STORE_PREFIX)) keys.push(key);
  }
  return keys;
}

/** A stored value as the backup carries it: parsed when it is JSON, raw when it is not. */
function readValue(storage: StorageLike, key: string): unknown {
  const raw = storage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    // A hand-edited or truncated value is still the visitor's data; carry it across verbatim.
    return raw;
  }
}

/** The whole drawer as one file. `now` is injectable so the timestamp is testable. */
export function exportAll(storage: StorageLike, now: Date = new Date()): Backup {
  const data: Record<string, unknown> = {};
  for (const key of storeKeys(storage)) data[key] = readValue(storage, key);
  return { version: BACKUP_VERSION, exportedAt: now.toISOString(), data };
}

/** Removes every key this site owns and nothing else. */
export function clearAll(storage: StorageLike): void {
  for (const key of storeKeys(storage)) storage.removeItem(key);
}

/**
 * Restores a backup. Validation happens before the first write, so a rejected file leaves the
 * store exactly as it was.
 *
 * Merge is a shallow merge per key — two objects become one, and the file wins on the keys it
 * names — which is what makes importing a second machine's progress additive. Anything that is not
 * an object on both sides is replaced outright, because there is no sensible way to merge it.
 */
export function importAll(storage: StorageLike, payload: unknown, mode: ImportMode): void {
  if (!isPlainObject(payload)) throw new InvalidBackup();
  if (payload.version !== BACKUP_VERSION) throw new InvalidBackup(`Unsupported backup version`);
  const { data } = payload;
  if (!isPlainObject(data)) throw new InvalidBackup();

  if (mode === 'replace') clearAll(storage);

  for (const [key, incoming] of Object.entries(data)) {
    if (!key.startsWith(STORE_PREFIX)) continue;
    const existing = mode === 'merge' ? readValue(storage, key) : null;
    const merged =
      mode === 'merge' && isPlainObject(existing) && isPlainObject(incoming)
        ? { ...existing, ...incoming }
        : incoming;
    storage.setItem(key, JSON.stringify(merged));
  }
}
