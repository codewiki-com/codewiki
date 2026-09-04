# Task 13 report: playground

## What changed

### Step 1: shareable URL state

- Added `src/lib/lz.ts` with query-safe `lz-string` encoding for `{ lang, code, tests? }`, defensive decoding that returns `null` for corrupt input, and compatibility for early links that compressed only the source.
- The playground restores `?lang=&code=`, accepts `?tests=`, resolves `?example=` after loading the example catalogue, and writes the current compressed state with `history.replaceState` before copying the share URL.

### Step 2: SQL and HTML runtimes

- Extended the runner protocol and registry with SQL and HTML; `normalizeLang` also maps SQLite aliases and maps CSS to the HTML preview runtime.
- Added a same-origin `sql.js` loader, fresh in-memory database per run, optional seed execution, aligned text-table output, stderr errors, and last-result CSV comparison for SQL katas.
- Added `scripts/vendor-sqljs.mjs`; `prebuild` now vendors `sql-wasm.js` and `sql-wasm.wasm` beside the existing Pyodide artifacts.
- Added a sandboxed `srcdoc` HTML/CSS preview using `sandbox="allow-scripts"`. `CodeRunners` now passes both the original fence language and its output mount, so topic-page `sql run`, `html run`, and `css run` fences use the shared registry.
- Verified the topic integration with a temporary SQL/HTML runnable-fence fixture page and a focused browser test (1 passed); both fixture files were removed afterward, and the final build contains no fixture route.

### Step 3: kata mode

- Added language-native Python and JS/TS assertion wrappers and an encoded SQL expectation marker; a successful run emits `ALL TESTS PASSED` and `parseTestResult` reduces the event stream to pass/failure state.
- A URL or example carrying tests reveals the Tests tab and kata banner, runs the wrapped source, reports pass/fail, and offers an “Ask AI to fix” ChatGPT deep link on failure.
- The repair request uses the existing `bugs` preset identity with a playground-specific instruction and includes the language, code, stdout, stderr, and failing assertion.

### Step 4: lazy editor

- Added a live server-rendered textarea that lazily upgrades on first focus to CodeMirror 6.
- Core editor modules and each language package are dynamic imports. The editor synchronizes its document back to the named textarea so form semantics and the no-editor fallback remain intact.
- The CodeMirror theme and highlighting use the same `--astro-code-*` variables as Shiki output. Light, dark, and 375 px Chinese layouts were visually inspected.

### Step 5: bilingual playground and example catalogue

- Added shared static English and Chinese routes with a `client:idle` Preact island. Language tabs, example picker/cards, Reset/Copy/Share/Run controls, editor and output panels, runtime footer, and Output/Tests/Variables tabs are present in server-rendered HTML.
- Added `/api/examples.json`, which scans every public topic body for runnable fenced blocks and records the normalized language, title, optional tests, source, locale, and topic title/URL.
- Python variables come from a post-run `dir()` snapshot; JavaScript and TypeScript use a `globalThis` before/after diff. Variables are disabled for SQL and HTML.
- Added natural English and Simplified Chinese strings and appended token-based responsive playground styles.

### Step 6: release wiring, budgets, and security

- Enabled the Playground nav link, removed `/playground/` from the link checker’s deferred list, and added the route to Lighthouse with the four category gates at 0.95 and a 307,200-byte script ceiling.
- No CSP change was required. The global policy already allows WebAssembly compilation through `'wasm-unsafe-eval'`; SQL does not need `'unsafe-eval'`. An `about:srcdoc` child matches the embedding page for `frame-src 'self'`, while omission of `allow-same-origin` gives the preview an opaque origin. The existing `script-src 'unsafe-inline'` permits authored inline preview scripts inside that sandbox.

## Tests and results

### Unit coverage

New named coverage:

- `playground URL state > round-trips CJK and emoji through a query-safe value`
- `playground URL state > turns corrupt or wrongly shaped input into null`
- `playground URL state > can read links that compressed only the source text`
- `wrapWithTests > appends Python assertions and a passing marker`
- `wrapWithTests > defines a useful JavaScript assertion before the program`
- `wrapWithTests > uses the JavaScript harness for TypeScript too`
- `wrapWithTests > carries SQL CSV expectations without exposing them to SQLite`
- `parseTestResult > passes only when the marker arrived without a failure`
- `parseTestResult > collects assertion output from stderr and error events`
- `SQL result helpers > aligns headings and result cells as a plain-text table`
- `SQL result helpers > parses quoted CSV cells`
- `SQL result helpers > compares the final SQL result to CSV headings and rows`
- `normalizeLang` now covers `sql`, `html`, and the `css` to `html` alias.

Full result: **33 files passed, 309 tests passed**.

### End-to-end coverage

`tests/e2e/playground.spec.ts`:

- `loads shared Python state and runs it in the browser`
- `runs SQL and formats the result as a table`
- `renders HTML in a sandboxed srcdoc iframe`
- `shares compressed editor state and copies the resulting URL`
- `loads a topic example into the editor`
- `shows kata pass and failure states with an AI repair action`
- `has no console errors while loading and running JavaScript`

Required Playwright command, including `run.spec.ts` and the existing phone/desktop layout matrix: **42 passed**.

### Required validation

- `pnpm lint`: passed; ESLint and Prettier clean.
- `pnpm check`: passed with 0 errors and 0 warnings; Astro printed the existing non-blocking `timeoutRace` async-conversion hint.
- `pnpm test`: passed, 33 files and 309 tests.
- `pnpm build`: passed, 99 static pages built; existing missing-draft content warnings are unchanged.
- `pnpm check:links`: passed, 1,907 internal links across 100 HTML files resolve.
- `pnpm exec playwright test tests/e2e/playground.spec.ts tests/e2e/run.spec.ts tests/e2e/layout.spec.ts`: passed, 42 tests.
- `pnpm exec lhci autorun`: passed on the final run across all nine configured URLs. The first run passed every Playground assertion but `/practice/flashcards/` fluctuated to 0.91 performance; the unchanged rerun scored that route 0.97 and passed the suite.

## Playground Lighthouse and bundle result

- Performance: **100**
- Accessibility: **100**
- Best Practices: **100**
- SEO: **100**
- Initial transferred script: **30,612 bytes** of the **307,200-byte** budget. CodeMirror language support, Pyodide, sql.js, and preview code are loaded only when used.

## Screenshots

Required 1440 x 900 captures:

- Light mode with Python output: `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-p2-t13/playground-light-python.png`
- Dark mode with Python output: `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-p2-t13/playground-dark-python.png`
- Light mode with the SQL result table: `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-p2-t13/playground-light-sql.png`

Additional 375 x 812 Chinese responsive check:

- `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-p2-t13/playground-mobile-zh.png`

## Deviations

- The controller required append-only changes to `src/data/site.ts`, so the existing `P2B_NAV = false` declaration was preserved and a Task 13 release constant was appended; `Nav.astro` uses the appended true constant. The visible behavior is the brief’s requested enabled Playground link without creating a merge conflict in the shared file.
- The Playground uses the existing topic-width shell and design tokens, then applies a dense two-pane workspace at desktop widths and a stacked workspace on narrower screens. This follows the product-workspace direction of the supplied mockups while fitting the established site shell.
- Lighthouse’s first-run flashcards fluctuation and successful unchanged rerun are recorded above; the Playground was 100/100/100/100 and within its script budget in both runs.
