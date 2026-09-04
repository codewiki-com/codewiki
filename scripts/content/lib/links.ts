/**
 * Link extraction and reachability checking for the bilingual corpus.
 *
 * The corpus carries thousands of outbound URLs written by hand over many years, plus
 * "further reading" sections whose entries are often bare book titles with no link at
 * all. Both are checked here: {@link extractLinks} pulls every http(s) URL out of the
 * prose (never out of code), {@link checkLinks} asks the network whether each one still
 * resolves, and {@link bookTitles} flags the unlinked titles a human has to verify.
 *
 * Network work is deliberately cheap and forgiving: `HEAD` first and `GET` only when a
 * host refuses it, a bounded worker pool, a per-request timeout, and a JSON cache that
 * keeps verdicts for a week so a re-run of the linter costs nothing. No single URL can
 * fail the run — an unreachable host becomes `status: 'error'`, never a thrown error.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface Link {
  url: string;
  /** 1-based line of the first occurrence. */
  line: number;
  /** Link text for `[text](url)`, the URL itself for autolinks and bare URLs. */
  text: string;
}

export interface LinkStatus {
  /** HTTP status, or `'error'` when the request never produced a response. */
  status: number | 'error';
  /** True when the URL answered successfully or requires authentication/browser access. */
  ok: boolean;
  /** The server answered, but would not serve this non-interactive check. */
  restricted?: boolean;
  /** ISO timestamp of the check that produced this verdict. */
  checkedAt: string;
  /** Which request answered, or `'cache'` when no request was made. */
  via: 'HEAD' | 'GET' | 'cache';
}

export interface BookTitle {
  /** 1-based line of the entry. */
  line: number;
  title: string;
}

export type LinkRule = 'dead-link' | 'unverified-book';

export interface LinkIssue {
  /** 1-based line of the offending entry. */
  line: number;
  rule: LinkRule;
  message: string;
  /** Present for `dead-link` only. */
  url?: string;
}

/** Alias kept so callers can `import type { Issue }` from this module. */
export type Issue = LinkIssue;

/** The slice of `fetch` this module uses; the global `fetch` satisfies it. */
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export interface CheckOptions {
  fetchImpl?: FetchLike;
  /** Maximum requests in flight. */
  concurrency?: number;
  /** Per-request budget, applied to the `HEAD` and the `GET` separately. */
  timeoutMs?: number;
  /** JSON file holding `{ [url]: LinkStatus }`; its directory is created on save. */
  cachePath?: string;
  /** Clock, injectable so tests can age the cache. */
  now?: () => number;
  /** Delay before the one retry; production uses two seconds, tests may shorten it. */
  retryDelayMs?: number;
  userAgent?: string;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_CACHE_PATH = 'reports/link-cache.json';
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const DEFAULT_ACCEPT =
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
const DEFAULT_RETRY_DELAY_MS = 2_000;

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

const OPEN_FENCE = /^( {0,3})(`{3,}|~{3,})(.*)$/;
const ATX_HEADING = /^ {0,3}(#{1,6})(?:\s+(.*?))?\s*$/;
const INLINE_CODE = /(`+)[^\n]*?\1/g;

/** A URL inside `(...)`: either bracketed, or a run that may contain balanced pairs. */
const LINK_TARGET = '<[^>\\s]*>|(?:[^\\s()]|\\([^\\s()]*\\))+';
const INLINE_LINK = new RegExp(
  `!?\\[([^\\]]*)\\]\\(\\s*(${LINK_TARGET})\\s*(?:"[^"]*"|'[^']*')?\\s*\\)`,
  'g',
);
const AUTOLINK = /<(https?:\/\/[^>\s]+)>/g;
const BARE_URL = /https?:\/\/[^\s<>"'　（）]+/g;
const HTTP_URL = /^https?:\/\//i;
/** Punctuation that ends a sentence rather than the URL it follows. */
const TRAILING_PUNCTUATION = '.,。，）';

interface ProseLine {
  line: number;
  /** The line with inline code blanked out; offsets are preserved. */
  text: string;
}

/** Closing delimiter of a YAML frontmatter block. */
const FRONTMATTER_END = /^(?:---|\.\.\.)\s*$/;

/** Index of the first body line, skipping a leading `---` frontmatter block. */
function bodyStart(lines: string[]): number {
  if (lines[0]?.trim() !== '---') return 0;
  const end = lines.findIndex((line, i) => i > 0 && FRONTMATTER_END.test(line));
  return end === -1 ? 0 : end + 1;
}

/**
 * Every line that is not inside a fenced code block, with inline code spans blanked.
 *
 * YAML frontmatter is skipped: its values are metadata, not prose, and a stray `---`
 * would otherwise open a phantom section. Line numbers stay absolute either way.
 *
 * `markdown.ts` strips fences by dropping lines, which loses the line numbers every
 * finding here has to report, so the scan is repeated locally against the same fence
 * grammar.
 */
function proseLines(md: string): ProseLine[] {
  const out: ProseLine[] = [];
  const lines = md.split('\n');
  let fence: { marker: string; length: number } | null = null;
  for (let i = bodyStart(lines); i < lines.length; i += 1) {
    const line = lines[i];
    const match = OPEN_FENCE.exec(line);
    if (fence) {
      if (
        match &&
        match[2][0] === fence.marker &&
        match[2].length >= fence.length &&
        match[3].trim() === ''
      ) {
        fence = null;
      }
      continue;
    }
    if (match && !(match[2][0] === '`' && match[3].includes('`'))) {
      fence = { marker: match[2][0], length: match[2].length };
      continue;
    }
    out.push({ line: i + 1, text: blank(line, INLINE_CODE) });
  }
  return out;
}

/** Replace every match with spaces, so later patterns cannot see it but offsets hold. */
function blank(text: string, pattern: RegExp): string {
  return text.replace(pattern, (match) => ' '.repeat(match.length));
}

/**
 * Every distinct http(s) URL in the document's prose, in document order.
 *
 * Markdown inline links (images included), autolinks and bare URLs are all recognised;
 * fenced and inline code are ignored, and a URL that appears more than once — an inline
 * use and its reference definition, say — is reported once, at its first line.
 * Relative targets and anchors are not returned: nothing here can resolve them.
 */
export function extractLinks(md: string): Link[] {
  const out: Link[] = [];
  const seen = new Set<string>();
  const add = (url: string, line: number, text: string): void => {
    if (!HTTP_URL.test(url) || seen.has(url)) return;
    seen.add(url);
    out.push({ url, line, text });
  };
  for (const { line, text } of proseLines(md)) {
    for (const match of text.matchAll(INLINE_LINK)) {
      add(unbracket(match[2]), line, match[1].trim());
    }
    let rest = blank(text, INLINE_LINK);
    for (const match of rest.matchAll(AUTOLINK)) add(match[1], line, match[1]);
    rest = blank(rest, AUTOLINK);
    for (const match of rest.matchAll(BARE_URL)) {
      const url = trimPunctuation(match[0]);
      add(url, line, url);
    }
  }
  return out;
}

/** Unwrap a `<...>` link target. */
function unbracket(target: string): string {
  return target.startsWith('<') && target.endsWith('>') ? target.slice(1, -1) : target;
}

/**
 * Drop sentence punctuation glued to the end of a bare URL. A closing parenthesis goes
 * only when it is unmatched, so `.../Foo_(bar)` survives while `(see .../foo)` does not.
 */
function trimPunctuation(url: string): string {
  let out = url;
  while (out.length > 0) {
    const last = out[out.length - 1];
    if (TRAILING_PUNCTUATION.includes(last)) {
      out = out.slice(0, -1);
      continue;
    }
    if (last === ')' && count(out, ')') > count(out, '(')) {
      out = out.slice(0, -1);
      continue;
    }
    return out;
  }
  return out;
}

function count(text: string, char: string): number {
  let total = 0;
  for (const candidate of text) if (candidate === char) total += 1;
  return total;
}

// ---------------------------------------------------------------------------
// Book titles
// ---------------------------------------------------------------------------

/**
 * Headings that open a further-reading section, in both languages. Anchored on purpose:
 * a substring match turns every `Rvalue References` or `快速参考表` section — 241 of the
 * 1436 candidates in the staging corpus — into a wall of false book titles.
 */
const READING_HEADING = /^(further reading|延伸阅读|references|参考(资源|资料|文献|链接)?)$/i;
/** Leading list numbering on a heading (`## 2. Further reading`). */
const HEADING_NUMBER = /^\d+\s*[.)、]\s*/;
const CJK_TITLE = /《([^》\n]+)》/;
/** `_title_`, rejected when either underscore sits inside a word (`snake_case`). */
const UNDERSCORE_TITLE = /(?<![\w\\])_([^_\n]+)_(?!\w)/;
const STAR_TITLE = /(\*{1,2})([^*\n]+)\1/;
/** `by` followed by a capitalised or Chinese name, optionally after a dash. */
const AUTHOR = /(?:^|[\s—–-])by\s+[\p{Lu}\p{Script=Han}]/u;
const LIST_MARKER = /^\s*(?:[-*+]|\d+[.)])\s+/;

/**
 * Book titles named in a further-reading section without being linked.
 *
 * The corpus cites books as `《书名》`, `_Title_` or `*Title*`, and sometimes as plain
 * text followed by an author (`Clean Code by Robert C. Martin`). None of those can be
 * verified automatically, so every match is reported for a human to confirm. Entries that
 * carry a link or a URL are left alone — {@link checkLinks} already vouches for those.
 *
 * Only the section itself is scanned: it runs from its heading to the next heading at the
 * same or a higher level.
 */
export function bookTitles(md: string): BookTitle[] {
  const out: BookTitle[] = [];
  let depth = 0;
  for (const { line, text } of proseLines(md)) {
    const heading = ATX_HEADING.exec(text);
    if (heading) {
      const level = heading[1].length;
      if (READING_HEADING.test(headingText(heading[2]))) depth = level;
      else if (depth > 0 && level <= depth) depth = 0;
      continue;
    }
    if (depth === 0) continue;
    const title = bookTitle(text);
    if (title) out.push({ line, title });
  }
  return out;
}

/** Normalise a heading for matching: drop list numbering and surrounding space. */
function headingText(raw: string | undefined): string {
  return (raw ?? '').trim().replace(HEADING_NUMBER, '').trim();
}

/**
 * A Markdown link target or a bare URL on the line. Such an entry is already verified by
 * {@link checkLinks}, so it is not a title anybody has to look up by hand.
 */
const LINKED_LINE = /\]\(|https?:\/\//i;

/** The cited title on one line, or `null` when the line names no book. */
function bookTitle(text: string): string | null {
  if (LINKED_LINE.test(text)) return null;
  const marked = CJK_TITLE.exec(text) ?? UNDERSCORE_TITLE.exec(text);
  if (marked) return marked[1].trim() || null;
  const star = STAR_TITLE.exec(text);
  if (star) return star[2].trim() || null;
  if (AUTHOR.test(text)) return text.replace(LIST_MARKER, '').trim() || null;
  return null;
}

// ---------------------------------------------------------------------------
// Reachability
// ---------------------------------------------------------------------------

/**
 * Resolve every URL, returning one verdict per distinct URL in input order.
 *
 * Each URL is tried with `HEAD`; hosts that answer 403 or 405, or that fail outright,
 * are retried with `GET` whose body is dropped as soon as the headers arrive. Verdicts
 * younger than seven days are served from `cachePath` without a request, and the file is
 * rewritten with whatever was learned. Nothing here throws: a failed request, an
 * unreadable cache and an unwritable cache directory are all absorbed.
 */
export async function checkLinks(
  urls: Iterable<string>,
  options: CheckOptions = {},
): Promise<Map<string, LinkStatus>> {
  const {
    fetchImpl = globalThis.fetch as FetchLike,
    concurrency = 8,
    timeoutMs = 10_000,
    cachePath = DEFAULT_CACHE_PATH,
    now = Date.now,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    userAgent = DEFAULT_USER_AGENT,
  } = options;

  const unique = [...new Set(urls)];
  const cache = await loadCache(cachePath);
  const fresh = new Map<string, LinkStatus>();
  const pending: string[] = [];
  for (const url of unique) {
    const cached = cache[url];
    if (cached && isFresh(cached, now())) {
      fresh.set(url, {
        ...cached,
        ok: reachable(cached.status),
        restricted: restricted(cached.status),
        via: 'cache',
      });
    } else pending.push(url);
  }

  let next = 0;
  const workers = Math.max(1, Math.min(concurrency, pending.length));
  await Promise.all(
    Array.from({ length: workers }, async () => {
      for (let index = next++; index < pending.length; index = next++) {
        const url = pending[index];
        const status = await probe(url, { fetchImpl, timeoutMs, retryDelayMs, userAgent, now });
        fresh.set(url, status);
        cache[url] = status;
      }
    }),
  );
  if (pending.length > 0) await saveCache(cachePath, cache);

  // Rebuild in input order: the worker pool finishes out of order.
  return new Map(unique.map((url) => [url, fresh.get(url) as LinkStatus]));
}

interface ProbeOptions {
  fetchImpl: FetchLike;
  timeoutMs: number;
  retryDelayMs: number;
  userAgent: string;
  now: () => number;
}

/** Statuses that mean "this host dislikes HEAD", not "this URL is dead". */
const RETRY_WITH_GET = new Set([403, 405]);
/** Statuses worth one delayed retry because they are commonly transient. */
const RETRYABLE = new Set([429, 503]);
/** A response in this set proves the URL exists even though the checker cannot read it. */
const RESTRICTED = new Set([401, 403, 405, 429]);

async function probe(url: string, options: ProbeOptions): Promise<LinkStatus> {
  const head = await requestWithRetry(url, 'HEAD', options);
  if (typeof head === 'number' && !RETRY_WITH_GET.has(head)) return verdict(head, 'HEAD', options.now);
  const get = await requestWithRetry(url, 'GET', options);
  // A restricted HEAD response is still evidence that the URL exists if the GET transfer fails.
  if (get === 'error' && typeof head === 'number' && RESTRICTED.has(head)) {
    return verdict(head, 'HEAD', options.now);
  }
  return verdict(get, 'GET', options.now);
}

function verdict(status: number | 'error', via: 'HEAD' | 'GET', now: () => number): LinkStatus {
  return {
    status,
    ok: reachable(status),
    restricted: restricted(status),
    checkedAt: new Date(now()).toISOString(),
    via,
  };
}

function restricted(status: number | 'error'): boolean {
  return typeof status === 'number' && RESTRICTED.has(status);
}

function reachable(status: number | 'error'): boolean {
  return (typeof status === 'number' && status >= 200 && status < 400) || restricted(status);
}

/** Retry one request after the configured delay on transport errors and transient statuses. */
async function requestWithRetry(
  url: string,
  method: 'HEAD' | 'GET',
  options: ProbeOptions,
): Promise<number | 'error'> {
  const first = await request(url, method, options);
  if (first !== 'error' && !RETRYABLE.has(first)) return first;
  await sleep(options.retryDelayMs);
  return request(url, method, options);
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** One request, returning its status or `'error'`. Never throws. */
async function request(
  url: string,
  method: 'HEAD' | 'GET',
  { fetchImpl, timeoutMs, userAgent }: ProbeOptions,
): Promise<number | 'error'> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': userAgent, Accept: DEFAULT_ACCEPT },
    });
    // The status line is the whole answer, so hang up before the body arrives.
    if (method === 'GET') discard(response, controller);
    return response.status;
  } catch {
    return 'error';
  } finally {
    clearTimeout(timer);
  }
}

/** Cancel an unread response body and abort the transfer, ignoring any complaint. */
function discard(response: Response, controller: AbortController): void {
  try {
    void response.body?.cancel().catch(() => undefined);
  } catch {
    // A locked or already-consumed body needs no cancelling.
  }
  controller.abort();
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

function isFresh(entry: LinkStatus, nowMs: number): boolean {
  const checkedAt = Date.parse(entry.checkedAt);
  return Number.isFinite(checkedAt) && nowMs - checkedAt < CACHE_TTL_MS;
}

/** Read `{ [url]: LinkStatus }`; a missing, unreadable or malformed file reads as empty. */
async function loadCache(cachePath: string): Promise<Record<string, LinkStatus>> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(cachePath, 'utf8'));
  } catch {
    return {};
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
  const out: Record<string, LinkStatus> = {};
  for (const [url, entry] of Object.entries(parsed as Record<string, unknown>)) {
    if (isLinkStatus(entry)) out[url] = entry;
  }
  return out;
}

function isLinkStatus(value: unknown): value is LinkStatus {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Partial<LinkStatus>;
  const status = typeof entry.status === 'number' || entry.status === 'error';
  return status && typeof entry.ok === 'boolean' && typeof entry.checkedAt === 'string';
}

/** Persist the cache, creating its directory. A read-only path is not worth failing on. */
async function saveCache(cachePath: string, cache: Record<string, LinkStatus>): Promise<void> {
  try {
    await mkdir(path.dirname(path.resolve(cachePath)), { recursive: true });
    await writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
  } catch {
    // The cache is an optimisation; losing it costs a re-check, not a run.
  }
}

// ---------------------------------------------------------------------------
// Lint findings
// ---------------------------------------------------------------------------

/**
 * Turn a document and a set of verdicts into lint findings, ordered by line.
 *
 * URLs missing from `statuses` are silently skipped, so a caller may check a subset —
 * or none at all, to collect book titles only.
 */
export function linkIssues(md: string, statuses: ReadonlyMap<string, LinkStatus>): LinkIssue[] {
  const issues: LinkIssue[] = [];
  for (const link of extractLinks(md)) {
    const status = statuses.get(link.url);
    if (!status || status.ok) continue;
    const reason = status.status === 'error' ? 'request failed' : `HTTP ${status.status}`;
    issues.push({ line: link.line, rule: 'dead-link', message: `dead link (${reason})`, url: link.url });
  }
  for (const { line, title } of bookTitles(md)) {
    issues.push({ line, rule: 'unverified-book', message: `unverified book title: ${title}` });
  }
  return issues.sort((a, b) => a.line - b.line);
}
