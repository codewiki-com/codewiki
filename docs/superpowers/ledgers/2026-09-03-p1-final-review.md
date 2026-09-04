# P1 site foundation — final whole-branch review

Reviewed the current `p1-site-foundation` worktree against the plan header and task list, the requested design-spec sections, the complete implementation tree named in the review brief, and the rendered build. Content prose under `src/content/**` was deliberately excluded.

## Gate results

- `ss -ltnp | grep ':4321 '` — PASS: no listener; port 4321 was free before the browser gates.
- `pnpm lint` — PASS: ESLint and Prettier completed with no errors or formatting differences.
- `pnpm check` — PASS: 153 files, 0 errors, 0 warnings, 1 informational hint.
- `pnpm test` — PASS: 22 test files, 215/215 tests.
- `pnpm build` — PASS: 73 Astro pages in 6.31 s; Pagefind saw 74 HTML files, indexed 18 pages / 1,617 words in 2 languages; vendored runtime set 26.2 MB with 0 new files written.
- `pnpm check:links` — PASS: 1,039 internal links checked across 74 pages.
- `pnpm test:e2e` — PASS: 93/93 tests in 13.1 s.
- `pnpm exec lhci autorun` — PASS: `/index.html` P/A/BP/SEO **99/100/100/100**, script **17,469 B**; `/python/index.html` **100/100/100/100**, script **17,999 B**; `/python/closures/index.html` **99/100/100/100**, script **30,940 B**; `/zh/python/closures/index.html` **99/100/100/100**, script **30,940 B**. All are below the 61,440 B script budget. LHCI retained non-failing warnings for two render-blocking requests on three URLs and the Chinese topic's DOM-size insight.

## Findings

### Critical

None.

### Important

1. **`public/_headers:7` and `public/_headers:18` — the deployed sandbox receives two mutually restrictive CSP policies.** The file and `docs/dev/deploy.md:45` say the most-specific Cloudflare Pages rule replaces `/*`, but Pages applies every matching rule and joins duplicate response-header values. Browsers enforce multiple CSP policies as an intersection. Consequently the global policy's `frame-ancestors 'none'` prevents an article from embedding `/sandbox.html`, while its `script-src` lacks `'unsafe-eval'` and blocks the sandbox's `new Function`. The local Astro preview does not apply `_headers`, so the passing runner e2e test cannot catch this production-only failure. Smallest fix: arrange for `/sandbox.html` to receive exactly one CSP—using non-overlapping Pages rules or a response-header function—and give that one policy `'unsafe-eval'` plus `frame-ancestors 'self'`; then assert the deployed response header and run the JavaScript runner against it. Cloudflare documents both additive matching and explicit header detachment in its [Pages headers documentation](https://developers.cloudflare.com/pages/configuration/headers/).

2. **`src/lib/seo.ts:62` and `src/lib/og.ts:107` — 23 pages advertise Open Graph images that the build does not create.** `buildHead()` derives a unique `/og{path}.png` for every page, whereas `ogEntries()` emits only home, track-hub, and published-topic cards. Inspection of all built `og:image` values found missing files for English 404, glossary, seven glossary terms, search, settings, and tracks pages, plus the corresponding Chinese pages except 404: 23 missing targets in total. A social crawler sharing any affected URL receives a 404 image, even though the page claims a 1200×630 card. Smallest fix: either generate entries for every advertised route or explicitly point those page types at an existing fallback; extend the distribution check to validate URL-valued metadata, not only `href`/`src` attributes.

3. **`src/pages-shared/Search.astro:28` — the internal search-result UI is indexable despite being deliberately omitted from the sitemap.** The page builds a normal canonical/hreflang head without `noindex`, while `astro.config.mjs:57` describes search as a query interface rather than a document and filters it out. A crawler can still discover `/search/` and `/zh/search/` from navigation and index thin, client-populated pages; sitemap exclusion is not an indexing directive. Smallest fix: pass `noindex: true` to `buildHead()` for Search, which also correctly suppresses its hreflang set.

4. **`src/lib/prefs.ts:120`, `src/lib/theme.ts:14`, and `src/islands/ThemeToggle.tsx:41` — preference storage is duplicated and its failure paths are not safe.** `readStore()` accepts valid JSON `null` as the requested object type, `readThemePref()` immediately dereferences that null, and the theme toggle reads/writes `localStorage` directly; `writeThemePref()` does not catch storage exceptions. Verified scenarios: seeding `cw:v1:prefs` with `null` makes `/settings/` throw `Cannot read properties of null (reading 'theme')`; making `Storage.setItem` throw leaves the theme button unable even to apply the requested in-memory theme because persistence happens first. Smallest fix: centralize theme access in the guarded `prefs.ts` API, validate parsed top-level shape and fields before returning them, and apply the UI independently of a failed persistence write. Add tests for a `null` payload and throwing `getItem`/`setItem`.

5. **`src/islands/Terms.tsx:39` and `src/islands/Terms.tsx:83` — the term tooltip contains a link that keyboard users cannot reach.** The shared `role="tooltip"` node is appended to `body` after the document's ordinary focusables, and the implementation explicitly allows the tab order to skip it. In a browser check, focusing “free variable” opened the card, but Tab moved directly to the next article term and repointed the tooltip; the “Glossary →” link was never focused. Interactive content also does not belong inside the ARIA tooltip pattern. Smallest fix: make the inline term itself a real link while keeping the tooltip descriptive-only, or implement the card as a proper popover/dialog placed in the focus order with focus management. Add a Tab-path e2e assertion.

6. **`src/pages-shared/Home.astro:172`, `src/pages-shared/Home.astro:190`, `src/components/Depth.astro:29`, and `src/components/Checkpoint.astro:19` — Chinese pages retain four visible English UI labels.** `/zh/` renders `term` and `quiz`; `/zh/python/closures/` renders `deep` and `checkpoint`, and none is replaced after hydration. This makes the primary Chinese route visibly mixed-language even with JavaScript enabled. Smallest fix: route these labels through `t()`/localized props (existing `depth.deep` and checkpoint-related keys can be reused where suitable) and cover them with a rendered-Chinese-page assertion.

### Minor

1. **`src/layouts/Base.astro:69` and `src/layouts/Base.astro:150` — part of Chinese localization is a post-parse DOM rewrite.** Markdown transforms emit English labels into static HTML and an inline body-end script replaces `data-i18n` text. With JavaScript disabled, Chinese callouts, Copy/Run controls, and the checkpoint sentence remain English; Pagefind also indexes the English originals. This was reproduced by searching `/zh/search/?q=Checkpoint`, which returned both Chinese topics solely from the static checkpoint text. Smallest fix: make the transforms locale-aware at build time, or apply a locale-specific AST pass before serialization.

2. **`src/components/Nav.astro:118` and `src/components/Nav.astro:141` — desktop and mobile theme controls are independent islands.** Clicking the desktop control to select Light and then narrowing/opening the mobile menu left the second control labelled System while the document was Light. Smallest fix: render one responsive control, or synchronize both instances through a shared theme-change event/store.

3. **`src/islands/Palette.tsx:452` — Tab focus does not synchronize the command palette's selected option.** Only pointer hover and arrow-key code call `setActive`; tabbing to another result leaves `aria-selected` and the input's `aria-activedescendant` on the old row. A screen reader can therefore announce a selected result different from the focused link. Smallest fix: update `active` in each result's `onFocus` and add a Tab-navigation assertion.

4. **`src/pages-shared/Topic.astro:275` and `src/islands/CodeRunners.tsx:189` — `client:visible` is effectively eager on every runnable topic.** The deliberately visible 1 px sentinel sits at the top of the article, so the controller hydrates on initial load even if the first runnable example is far below the fold and the reader never runs code. The controller chunk is 7,124 B raw / 3,044 B gzip; the much larger Pyodide/esbuild runtimes do remain interaction-lazy, and the measured script budgets pass. Smallest fix: put the visibility trigger at the first runnable code box or load the controller on the first Run interaction.

5. **`.github/workflows/ci.yml:19` and `docs/dev/deploy.md:95` — the link checker is not part of the documented or automated merge gate.** `pnpm check:links` passes locally, but a later broken internal link can merge because CI jumps from build to browser installation. Smallest fix: add `pnpm check:links` immediately after build and include it in the documented command sequence.

6. **`astro.config.mjs:55` — the sitemap has no freshness data.** The built sitemap correctly contains 68 canonical URLs and 136 bilingual alternates, and excludes noindex/non-document routes, but it contains zero `<lastmod>` elements despite topic review/verification dates being available. Crawlers therefore lose the spec's requested freshness signal. Smallest fix: supply `lastmod` from content review metadata through a custom sitemap serializer/generator and test representative topic entries.

7. **`src/lib/og.ts:30` — the separately copied OG palette has already drifted from the site tokens.** `C.ink3` is still `#7b8190`, while `src/styles/tokens.css:22` now uses the contrast-corrected `#676d7c`; the old value is used for the generated card footer at `src/lib/og.ts:416`. Social cards therefore preserve the pre-fix low-contrast color after the web UI changed. Smallest fix: source build-time OG colors from one shared palette representation, or update the constant and add a lockstep test.

8. **`docs/dev/deploy.md:84` and `src/i18n/zh.ts:1` — merge-era guidance is stale.** Deployment docs still say color contrast is warning-only with ten open failures, although `lighthouserc.json` now makes it an error and the contrast e2e coverage passes; the Chinese dictionary still says all values are `[zh]` placeholders even though it is translated. A maintainer following these notes gets the wrong release posture and translation state. Smallest fix: update or remove the obsolete paragraphs/comments. The false CSP explanation at `docs/dev/deploy.md:45` must be corrected with Important finding 1.

## Deferred minors

The table expands every item from the ledger lines containing `minor (deferred)`. “Still present” means the exact implementation characteristic remains; it does not promote accepted editorial/process notes into release blockers.

| Task | Deferred item | Status | Evidence / disposition |
|---|---|---|---|
| 0 | Grouped Source lines cover several snippets | Still present | `docs/dev/astro7-notes.md` still groups multiple examples under shared source citations. |
| 0 | Endpoint-typing “ambiguity” is the brief's assumption | Still present | The uncertainty note remains in `docs/dev/astro7-notes.md`; documentation-only. |
| 0 | Stray “Before:” comment in `compressHTML` snippet | Still present | The comment remains in the notes snippet. |
| 0 | Version-table / Preact-appendix scope creep | Still present | Both additions remain in `docs/dev/astro7-notes.md`; harmless documentation scope. |
| 2 | Unguarded localStorage in ThemeToggle click | Still present | `ThemeToggle.tsx:54-56`; promoted to Important finding 4. |
| 2 | `readThemePref` crashes on JSON `null` | Still present | `theme.ts:23`; reproduced and promoted to Important finding 4. |
| 2 | SSR theme icon/label wrong until idle hydration | Still present | Island state still initializes to `system` at `ThemeToggle.tsx:36`. |
| 2 | No live announcement for theme change | Still present | The control updates its accessible name but has no status/live announcement. |
| 2 | `@theme inline` font self-reference | Still present | The redundant font aliases remain in `tokens.css`. |
| 2 | Potentially dead syntax classes | Fixed | The old short syntax selectors are no longer present; Shiki CSS variables are used. |
| 2 | `.codebox` overflow versus `pre` horizontal scrolling | Fixed | Current code-block styles give `pre` horizontal overflow. |
| 2 | Missing `.zh` font rule | Fixed | `global.css` now defines the Chinese font treatment. |
| 2 | Theme test does not lock preference-merge behavior | Still present | Tests do not cover preserving unrelated preference fields across a theme write. |
| 3 | Font fetch writes are non-atomic | Still present | `scripts/fetch-fonts.mjs` writes directly rather than temp-file plus rename. |
| 3 | `format('woff2')` versus `woff2-variations` note | Still present | `fonts.css` continues to declare variable files as `format('woff2')`. |
| 3 | Font preload hint deferred to Task 8 | Fixed | `Base.astro` now emits the intended preload links. |
| 4 | Home eyebrow lacks the mockup's `//` prefix | Fixed | `Home.astro` renders the prefix as component chrome. |
| 4 | Settings/search/not-found copy lacks a mockup source | Not applicable | This is editorial provenance, and content prose is outside this review. |
| 5 | Postgres/PostgreSQL naming asymmetry | Still present | The two forms remain in `tracks.ts`. |
| 5 | `Section.description` is unused | Still present | It remains optional in the type and is not consumed. |
| 5 | Track descriptions are implementer/editorial copy | Not applicable | Editorial review was explicitly deferred and prose is out of scope here. |
| 6 | `listTopics` `localeCompare` does not pass a locale | Still present | `src/lib/content.ts:37`. |
| 6 | Section regex duplicates shared slug logic | Still present | `src/schemas/topic.ts` still carries its own section-slug pattern. |
| 6 | Terms/quiz references could be typed refs | Still present | Topic schema still models these as string identifiers rather than content references. |
| 6 | Fixture test does not cross-check term/quiz existence | Still present | No content integrity test resolves every referenced ID. |
| 6 | Empty outcomes/source titles are allowed | Still present | The schema still permits those empty values. |
| 6 | Codex brief permits title/description edits | Not applicable | This is a process-policy note, not a branch defect; content prose was not re-reviewed. |
| 7 | `buildHead` lacks trailing-slash normalization | Still present | `seo.ts:71` trusts the caller's path shape. |
| 7 | Publisher/provider JSON-LD objects are duplicated | Still present | The equivalent objects remain in separate builders. |
| 7 | Extra `formatTitle` / `ogImageUrl` exports | Still present | Both remain exported; `ogImageUrl` is also part of the current OG tests. |
| 8 | Footer locale link lacks `lang`/`hreflang` | Still present | The footer alternate-language anchor still has neither attribute. |
| 8 | Compression breakpoint is tuned to English labels | Still present | The accepted fixed breakpoint remains; no locale-specific fit logic was added. |
| 8 | Details menu does not close on outside click | Still present | Native `<details>` remains open until its summary or navigation changes it. |
| 8 earlier | Duplicate NavLinks markup | Still present | `Nav.astro:88` and `Nav.astro:128` render the same link set twice. |
| 8 earlier | Duplicate ThemeToggle island can show a stale glyph/label | Still present | Reproduced; Minor finding 2. |
| 8 earlier | Drop alternates when `noindex` | Fixed | `seo.ts:101-107` now returns an empty alternate set for noindex pages. |
| 8 earlier | `Button` index signature | Still present | `Button.astro:10` still accepts arbitrary props through `[key: string]: unknown`. |
| 8 earlier | Icon exhaustive/default branch concern | Still present | `Icon.astro:37-68` has an exhaustive typed switch and no runtime fallback. |
| 8 earlier | Favicon uses `currentColor` | Still present | `public/favicon.svg:1` still depends on `currentColor`. |
| 9 | Duplicate placeholder interpolation | Still present | Placeholder filling remains implemented in more than one client path. |
| 9 | Unused Pagefind `body` branch in Base | Fixed | `Base.astro:65-67` now uses the body Pagefind metadata branch. |
| 9 | Preference-storage byte-size guard | Still present | Preference sanitization caps collections but not serialized storage size. |
| 9 | Palette `titles` prop grows with the topic set | Still present | The full topic-title map is still serialized to the island. |
| 9 | English palette chips on Chinese home | Still present | Reproduced; part of Important finding 6. |
| 9 | Lone continue card stretches full width | Still present | The auto-fit grid still expands a single card across the row. |
| 9 | `getContinue` assumes object entries | Still present | Its typed cast is not backed by runtime top-level/entry validation. |
| 10 | Unregistered section slugs vanish silently | Still present | No content check verifies every topic section against `tracks.ts`. |
| 10 | `Seg` index signature | Still present | The permissive prop index signature remains. |
| 10 | Dead `.ic` CSS | Still present | `global.css:339` defines `.ic`, with no rendered use found. |
| 10 | Effect dependency concern | Still present | The TrackHub enhancement effect still closes over setup values with a fixed dependency set. |
| 10 | Playwright environment handling | Fixed | `playwright.config.ts` now carries the intended deterministic server environment. |
| 11 | `data-highlight` not propagated to figure | Still present | The attribute remains on code content rather than the wrapper figure. |
| 11 | Bare fences render as output boxes | Fixed | Truly unlabelled fences now remain plain code; explicitly labelled `text` fences intentionally use output styling. |
| 11 | `env.d.ts` wildcard | Still present | The broad module declaration remains. |
| 11 | English labels in Chinese static HTML until swap | Still present | Reproduced; Minor finding 1. |
| 11 | `Depth` uses `slots.render` plus `set:html` | Still present | `Depth.astro` still serializes its slot, which would not preserve a nested hydrated island. |
| 11 | Tests missing nested callouts, inline-marker text, and `localeOfPath` cases | Still present | Those three coverage gaps remain. |
| 12 | TrackHub path card has a static progressbar role | Still present | The accepted, non-updating progress role remains. |
| 12 | ReadTracker imports `DEPTH_EVENT` from DepthDial | Still present | The cross-island import remains instead of a neutral shared module. |
| 12 | Section slug `main` collides with `#main` | Still present | No schema/content check reserves the layout's `main` ID. |
| 13 | Plaintext-only fallback is effectively dead | Still present | The runner's `textContent` path makes its `innerText` fallback unreachable and has no protective parse try/catch. |
| 13 | 4,500 ms drain is near the 5,000 ms budget | Still present | The fixed timeout margin remains. |
| 13 | Concurrent Python runs share streams | Still present | All runs still share one Pyodide interpreter and redirected stream state. |
| 13 | `innerText` fallbacks are unreachable | Still present | The nullish `textContent` checks cannot normally take the fallback. |
| 13 | Unsupported-language undo path | Still present | Unsupported runnable figures retain the no-op/undo handling. |
| 13 | `hasRunnable` is a markup-regex heuristic | Still present | Topic rendering still decides island inclusion from rendered HTML shape. |
| 14 | Breadcrumb pill and JSON-LD term names differ | Still present | One uses the term ID while structured data uses the display name. |
| 14 | Duplicate glossary nav label | Still present | The repeated label remains in glossary navigation UI. |
| 14 | Duplicated glossary sort | Still present | Sorting remains separately implemented at the call sites. |
| 14 | No dedicated touch interaction path | Still present | Term-card behavior still relies on focus/pointer behavior rather than an explicit touch path. |
| 14 | No resize reposition handler | Still present | An open tooltip is not repositioned on viewport resize. |
| 17 | Immediate `revokeObjectURL` timing | Still present | Export revokes immediately after initiating the download. |
| 17 | Redundant GUID `customData` | Still present | The duplicate GUID metadata remains in the generated VS Code profile. |
| 17 | Settings pages in sitemap | Fixed | The sitemap filter excludes both locale settings routes. |
| 17 | Dead API tie-break | Still present | `api.ts:39-42` retains a tie-break whose earlier sort keys make its useful cases unreachable. |
| 17 | `llms-full.txt` lacks a final newline | Still present | Generation ends with `join(...)` and no appended newline. |
| 17 | Export filename uses UTC date | Still present | It still derives the filename from `toISOString()`. |
| 18 | `warnOnce` registry makes tests order-dependent | Still present | There is still no test-only reset for the module registry. |
| 18 | SemiBold-only font path is untested | Still present | Font-fallback coverage does not isolate that path. |
| 16 | Multi-fence callouts are untested | Still present | Current tests cover a single fence per callout. |
| 16 | Line-wrapped opening tags | Still present | The prompt transform still assumes the opening construct is on one line. |
| 16 | No unit test for clipboard-undefined branch | Still present | The guarded implementation exists, but that branch is not directly exercised. |
| 16 | `.sec-ask` placement | Still present | The negative-offset placement remains a CSS magic value. |
| 16 | Domain-track language label | Still present | Topic prompt wiring still derives the language label from the track name for this future case. |
| 15 | Tab-focused rows do not sync `active`/`aria-selected` | Still present | Reproduced; Minor finding 3. |
| 15 | Literal nested `<mark>` in prose becomes a highlight | Still present | The accepted selector/markup concession remains. |

## Verdict

**Not ready — fix the Cloudflare CSP/sandbox collision, missing advertised OG assets, indexable search pages, unsafe preference-storage fallbacks, unreachable term-tooltip links, and untranslated Chinese UI labels.**
