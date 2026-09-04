/**
 * Syntax checker for fenced code blocks in the bilingual corpus.
 *
 * Every fence is folded onto a canonical language, then handed to the cheapest parser
 * that can answer "does this at least parse?": esbuild for the JavaScript family, the
 * host `python3` for Python, `JSON.parse`/`yaml.parse` for data, and whatever compiler
 * front-end happens to be on PATH for the compiled languages. Anything without a
 * checker — prose, shell, config dialects, unknown info strings — is reported as
 * `skipped` rather than guessed at, so a missing toolchain never turns into a false
 * failure. External tools are also skipped (never failed) when absent or slow.
 *
 * Two shapes of "not really code" are recognised before any parser runs: placeholder
 * fences, whose entire body is an ellipsis or a `TODO`, are an authoring error; REPL and
 * shell transcripts are prose about running code and are skipped.
 */
import { spawn } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild-wasm';
import { parseAllDocuments } from 'yaml';
import { fences } from './markdown';

export interface FenceCheck {
  ok: boolean;
  /** Human-readable reason, usually `line N: message`; `placeholder` for empty stubs. */
  error?: string;
  /** True when no checker ran; `ok` is then meaningless and always true. */
  skipped?: boolean;
  /** Which checker answered: a binary name, or `none`/`missing`/`timeout`/`repl`/`fragment`. */
  tool?: string;
  /** True when real code contains an `...` elision line, which is tolerated. */
  elided?: boolean;
}

export interface FenceResult extends FenceCheck {
  /** 1-based line of the opening fence. */
  line: number;
  /** Info string language as written in the document, lowercased. */
  lang: string;
}

export interface FenceInput {
  lang: string;
  code: string;
}

/** Canonical languages the checker knows about; everything else folds onto `skip`. */
export type Language =
  | 'js'
  | 'jsx'
  | 'ts'
  | 'tsx'
  | 'python'
  | 'json'
  | 'jsonc'
  | 'yaml'
  | 'go'
  | 'rust'
  | 'java'
  | 'cpp'
  | 'csharp'
  | 'swift'
  | 'kotlin'
  | 'php'
  | 'skip';

const ALIASES: Record<string, Language> = {
  js: 'js',
  javascript: 'js',
  mjs: 'js',
  cjs: 'js',
  jsx: 'jsx',
  ts: 'ts',
  typescript: 'ts',
  tsx: 'tsx',
  py: 'python',
  python: 'python',
  python3: 'python',
  json: 'json',
  jsonc: 'jsonc',
  yaml: 'yaml',
  yml: 'yaml',
  go: 'go',
  golang: 'go',
  rs: 'rust',
  rust: 'rust',
  java: 'java',
  cpp: 'cpp',
  'c++': 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  c: 'cpp',
  cs: 'csharp',
  csharp: 'csharp',
  swift: 'swift',
  kt: 'kotlin',
  kotlin: 'kotlin',
  php: 'php',
};

/**
 * Fold a fence info string onto a canonical language. Unknown languages, prose and the
 * config dialects we deliberately do not parse (`sql`, `bash`, `html`, `json5`, …) all
 * become `skip`.
 */
export function normaliseLang(lang: string): Language {
  return ALIASES[lang.trim().toLowerCase()] ?? 'skip';
}

/** A fence body that is nothing but an ellipsis, a `pass` or a `TODO` is an empty stub. */
const PLACEHOLDER_LINE =
  /^(?:\.{3,}|…+|pass|TODO\b.*|(?:#|\/\/)\s*(?:\.{3,}|…+|TODO\b.*)|\/\*\s*(?:\.{3,}|…+|TODO\b.*?)\s*\*\/)$/;
/** The subset of the above that may appear inside real code to stand for omitted lines. */
const ELISION_LINE = /^(?:\.{3,}|…+|(?:#|\/\/)\s*(?:\.{3,}|…+)|\/\*\s*(?:\.{3,}|…+)\s*\*\/)$/;
/** A bare ellipsis is a statement only in Python; elsewhere it has to be blanked out. */
const BARE_ELISION = /^(?:\.{3,}|…+)$/;
/** Shell prompt or REPL banner: the fence is a transcript, not a compilable snippet. */
const PROMPT_LINE = /^(?:\$ |>>>|PS[ >]|C:\\)/;

const TOOL_TIMEOUT_MS = 10_000;
const PY_CHECK = fileURLToPath(new URL('py-check.py', import.meta.url));

/** No usable verdict: `none`, `missing`, `timeout`, `repl` or `fragment`. */
function skip(tool: 'none' | 'missing' | 'timeout' | 'repl' | 'fragment'): FenceCheck {
  return { ok: true, skipped: true, tool };
}

/**
 * Check one fenced block. Never throws and never rejects: an unusable checker turns into
 * `skipped`, so callers can treat every `ok: false` as a real finding.
 */
export async function checkFence({ lang, code }: FenceInput): Promise<FenceCheck> {
  const lines = code.split('\n').map((line) => line.trim());
  const content = lines.filter((line) => line !== '');
  if (content.length === 0) return skip('none');
  if (content.every((line) => PLACEHOLDER_LINE.test(line))) return { ok: false, error: 'placeholder' };

  const language = normaliseLang(lang);
  if (language === 'skip') return skip('none');
  if (isTranscript(language, content)) return skip('repl');

  const elided = content.some((line) => ELISION_LINE.test(line));
  const source = elided && language !== 'python' ? blankElisions(code) : code;
  const result = await runChecker(language, source);
  return elided ? { ...result, elided: true } : result;
}

/** Check every fenced block in a Markdown document, in document order. */
export async function checkFences(md: string): Promise<FenceResult[]> {
  const results: FenceResult[] = [];
  for (const fence of fences(md)) {
    const lang = fence.lang.trim().toLowerCase();
    results.push({ line: fence.line, lang, ...(await checkFence({ lang, code: fence.code })) });
  }
  return results;
}

/** True when the fence is a shell session or REPL transcript rather than a source file. */
function isTranscript(language: Language, content: string[]): boolean {
  if (!['js', 'jsx', 'ts', 'tsx', 'python'].includes(language)) return false;
  if (PROMPT_LINE.test(content[0])) return true;
  return language === 'python' && content.some((line) => line.startsWith('>>>'));
}

/** Replace `...` elision lines with blanks so line numbers survive but parsers do not trip. */
function blankElisions(code: string): string {
  return code
    .split('\n')
    .map((line) => (BARE_ELISION.test(line.trim()) ? '' : line))
    .join('\n');
}

async function runChecker(language: Language, code: string): Promise<FenceCheck> {
  switch (language) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return checkEsbuild(language, code);
    case 'python':
      return checkPython(code);
    case 'json':
    case 'jsonc':
      return checkJson(stripJsonComments(code));
    case 'yaml':
      return checkYaml(code);
    case 'go':
      return checkWith('gofmt', ['gofmt', '-e'], { code });
    case 'rust':
      return checkWith('rustfmt', ['rustfmt', '--emit', 'stdout', '--edition', '2021'], { code });
    case 'java':
      return classify('java', await checkJava(code));
    case 'cpp':
      return classify('cpp', await checkWith('g++', ['g++', '-fsyntax-only', '-x', 'c++', '-'], { code }));
    case 'csharp':
      return checkCSharp(code);
    case 'swift':
      return checkWith('swiftc', ['swiftc', '-parse'], { code, suffix: '.swift' });
    case 'kotlin':
      return checkKotlin(code);
    case 'php':
      // `php -l` treats input without an opening tag as HTML, so add one without shifting lines.
      return checkWith('php', ['php', '-l'], { code: code.includes('<?') ? code : `<?php ${code}` });
    default:
      return skip('none');
  }
}

const LOADERS: Record<string, 'js' | 'jsx' | 'ts' | 'tsx'> = { js: 'js', jsx: 'jsx', ts: 'ts', tsx: 'tsx' };

async function checkEsbuild(language: Language, code: string): Promise<FenceCheck> {
  try {
    await esbuild.transform(code, { loader: LOADERS[language], logLevel: 'silent' });
    return { ok: true, tool: 'esbuild' };
  } catch (error) {
    const first = (error as { errors?: { text?: string; location?: { line?: number } | null }[] })
      .errors?.[0];
    const text = first?.text ?? (error as Error).message;
    return { ok: false, error: at(first?.location?.line, text), tool: 'esbuild' };
  }
}

async function checkPython(code: string): Promise<FenceCheck> {
  const run = await runProcess(['python3', PY_CHECK], code);
  if (run.timedOut) return skip('timeout');
  if (run.missing) return skip('missing');
  if (run.status === 0) return { ok: true, tool: 'python3' };
  const message = run.stdout.trim() || run.stderr.trim() || 'python3 failed';
  return { ok: false, error: message.split('\n')[0], tool: 'python3' };
}

function checkJson(code: string): FenceCheck {
  try {
    JSON.parse(code);
    return { ok: true, tool: 'json' };
  } catch (error) {
    return { ok: false, error: (error as Error).message, tool: 'json' };
  }
}

/** `yaml` appends its own location to every message; `at()` puts it back at the front. */
const YAML_POSITION = / at line \d+, column \d+:?\s*$/;

function checkYaml(code: string): FenceCheck {
  try {
    // A fence may hold a whole `---`-separated stream (Kubernetes manifests do), which is
    // valid YAML that the single-document `parse` refuses, so read every document and
    // report the first one that failed. `logLevel: 'error'` silences warnings such as
    // unresolved custom tags, which the parser would otherwise print to the console.
    const documents = parseAllDocuments(code, { logLevel: 'error' });
    const failure = documents.flatMap((document) => document.errors)[0];
    if (!failure) return { ok: true, tool: 'yaml' };
    const message = failure.message.split('\n')[0].replace(YAML_POSITION, '');
    return { ok: false, error: at(failure.linePos?.[0]?.line, message), tool: 'yaml' };
  } catch (error) {
    return { ok: false, error: (error as Error).message.split('\n')[0], tool: 'yaml' };
  }
}

/**
 * Drop `//` and block comments, leaving comment markers that sit inside strings. Fences
 * tagged `json` carry JSONC as often as fences tagged `jsonc` do — editor and agent
 * settings samples above all — so both go through this before `JSON.parse`. Newlines
 * inside a stripped block comment are kept so reported positions stay meaningful.
 */
export function stripJsonComments(code: string): string {
  let out = '';
  let inString = false;
  for (let i = 0; i < code.length; i += 1) {
    const char = code[i];
    if (inString) {
      out += char;
      if (char === '\\') {
        out += code[i + 1] ?? '';
        i += 1;
      } else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }
    if (char === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') i += 1;
      out += '\n';
      continue;
    }
    if (char === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        if (code[i] === '\n') out += '\n';
        i += 1;
      }
      i += 1;
      continue;
    }
    out += char;
  }
  return out;
}

/** `javac` insists a public type live in a like-named file, so mirror the declared name. */
const PUBLIC_TYPE =
  /\bpublic\s+(?:final\s+|abstract\s+|sealed\s+|strictfp\s+)*(?:class|interface|enum|record)\s+(\w+)/;

async function checkJava(code: string): Promise<FenceCheck> {
  if (!which('javac')) return skip('missing');
  const name = PUBLIC_TYPE.exec(code)?.[1] ?? 'Snippet';
  return withTempDir(async (dir) => {
    const file = path.join(dir, `${name}.java`);
    await writeFile(file, code, 'utf8');
    return runTool('javac', ['javac', '-nowarn', '-d', dir, file], '');
  });
}

async function checkCSharp(code: string): Promise<FenceCheck> {
  // The `dotnet` driver only builds projects; the Roslyn/Mono `csc` front-end takes a file.
  const binary = ['csc', 'mcs'].find((candidate) => which(candidate));
  if (!binary) return skip('missing');
  return withTempDir(async (dir) => {
    const file = path.join(dir, 'snippet.cs');
    await writeFile(file, code, 'utf8');
    return runTool(binary, [binary, '-nologo', `-out:${path.join(dir, 'snippet.exe')}`, file], '');
  });
}

async function checkKotlin(code: string): Promise<FenceCheck> {
  if (!which('kotlinc')) return skip('missing');
  return withTempDir(async (dir) => {
    const file = path.join(dir, 'snippet.kt');
    await writeFile(file, code, 'utf8');
    return runTool('kotlinc', ['kotlinc', '-nowarn', '-d', dir, file], '');
  });
}

interface ToolOptions {
  code: string;
  /** When set, the code goes to a temp file with this suffix instead of stdin. */
  suffix?: string;
}

/** Run an external checker, or report it as `missing` when it is not on the search path. */
async function checkWith(binary: string, argv: string[], options: ToolOptions): Promise<FenceCheck> {
  if (!which(binary)) return skip('missing');
  if (!options.suffix) return runTool(binary, argv, options.code);
  return withTempDir(async (dir) => {
    const file = path.join(dir, `snippet${options.suffix}`);
    await writeFile(file, options.code, 'utf8');
    return runTool(binary, [...argv, file], '');
  });
}

async function withTempDir(run: (dir: string) => Promise<FenceCheck>): Promise<FenceCheck> {
  const dir = await mkdtemp(path.join(tmpdir(), 'code-check-'));
  try {
    return await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Spawn `argv` with `stdin`, then turn its exit status into a {@link FenceCheck}. */
async function runTool(binary: string, argv: string[], stdin: string): Promise<FenceCheck> {
  const run = await runProcess(argv, stdin);
  if (run.timedOut) return skip('timeout');
  if (run.missing) return skip('missing');
  if (run.status === 0) return { ok: true, tool: binary };
  return { ok: false, error: firstDiagnostic(run.stderr || run.stdout, binary), tool: binary };
}

/** `file:LINE:COL: error: message`, as emitted by gofmt, javac and g++. */
const LOCATED = /^(?:.*?):(\d+)(?::\d+)?:\s*(?:fatal\s+)?(?:error|warning)?:?\s*(.+)$/i;
/** rustc-style diagnostics put the location on a following `--> file:LINE:COL` line. */
const ARROW = /^-->\s*\S*?:(\d+)(?::\d+)?/;
/** PHP appends the location to the message instead of prefixing it. */
const ON_LINE = / on line (\d+)\s*$/i;
const NOISE = /^(?:PHP\s+)?(?:Parse\s+|Fatal\s+)?(?:error|warning):\s*/i;

/** Compiler diagnostics are verbose; reduce them to `line N: message` where possible. */
function firstDiagnostic(output: string, binary: string): string {
  const lines = output.split('\n').filter((line) => line.trim() !== '');
  if (lines.length === 0) return `${binary} failed`;
  const index = Math.max(
    0,
    lines.findIndex((line) => /\b(?:error|fatal)\b/i.test(line)),
  );
  const raw = lines[index].trim();
  const located = LOCATED.exec(raw);
  if (located) return at(Number(located[1]), located[2].trim().slice(0, 200));
  const arrow = lines
    .slice(index + 1, index + 4)
    .map((line) => ARROW.exec(line.trim()))
    .find((match) => match !== null);
  const onLine = ON_LINE.exec(raw);
  const message = raw.replace(NOISE, '').replace(/ in Standard input code on line \d+\s*$/i, '');
  return at(onLine ? Number(onLine[1]) : arrow ? Number(arrow[1]) : undefined, message.trim().slice(0, 200));
}

function at(line: number | undefined, text: string): string {
  return line ? `line ${line}: ${text}` : text;
}

/**
 * `javac` and `g++` are compilers, not parsers: handed a fence that is a method body or a
 * class without its imports they report missing symbols and absent headers, which say
 * nothing about whether the snippet is well-formed. Only diagnostics that name a parse
 * failure are reported; the rest become `skipped` with `tool: 'fragment'`, so an excerpt
 * is never mistaken for broken code.
 */
const JAVA_SYNTAX =
  /\b(?:expected|illegal start of|unclosed|reached end of file while parsing|not a statement)\b/i;
const CPP_SYNTAX = /\b(?:expected|unterminated|missing terminating|stray|unmatched|before)\b/i;

/**
 * The two diagnostics that mean "this fence is an excerpt", one per language: a fence of
 * bare statements where Java wants a type declaration, and a loop or statement where C++
 * wants a declaration at file scope. Both look syntactic but only describe the missing
 * enclosing scope, so they are excluded before the allowlist is consulted.
 */
const JAVA_FRAGMENT = /class, interface, enum, or record expected/i;
const CPP_FRAGMENT = /expected unqualified-id before/i;

function classify(language: 'java' | 'cpp', result: FenceCheck): FenceCheck {
  if (result.ok || result.skipped) return result;
  const message = result.error ?? '';
  const syntactic =
    language === 'java'
      ? !JAVA_FRAGMENT.test(message) && JAVA_SYNTAX.test(message)
      : !CPP_FRAGMENT.test(message) && CPP_SYNTAX.test(message);
  return syntactic ? result : skip('fragment');
}

interface ProcessRun {
  status: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  missing: boolean;
}

/** Run a child process with `stdin` piped in, capped at {@link TOOL_TIMEOUT_MS}. */
function runProcess(argv: string[], stdin: string): Promise<ProcessRun> {
  return new Promise((resolve) => {
    const child = spawn(argv[0], argv.slice(1), {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PATH: searchPath() },
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, TOOL_TIMEOUT_MS);
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', () => {
      clearTimeout(timer);
      resolve({ status: null, stdout, stderr, timedOut, missing: true });
    });
    child.on('close', (status) => {
      clearTimeout(timer);
      resolve({ status, stdout, stderr, timedOut, missing: false });
    });
    child.stdin.on('error', () => undefined);
    child.stdin.end(stdin);
  });
}

/** Search path for external checkers; `CODE_CHECK_PATH` overrides it, mainly for tests. */
function searchPath(): string {
  return process.env.CODE_CHECK_PATH ?? process.env.PATH ?? '';
}

const whichCache = new Map<string, boolean>();

/** True when `binary` is an executable file on the current search path. */
function which(binary: string): boolean {
  const search = searchPath();
  const key = `${search}\u0000${binary}`;
  const cached = whichCache.get(key);
  if (cached !== undefined) return cached;
  const found = search
    .split(path.delimiter)
    .filter((dir) => dir !== '')
    .some((dir) => {
      try {
        accessSync(path.join(dir, binary), constants.X_OK);
        return true;
      } catch {
        return false;
      }
    });
  whichCache.set(key, found);
  return found;
}
