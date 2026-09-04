# SDD ledger — plan: docs/superpowers/plans/2026-09-03-p1-site-foundation.md

Worktree: /home/chen/githubprojects/codewiki/codewiki/.worktrees/p1-site-foundation (branch p1-site-foundation, from main 518e01f)
Spec: docs/superpowers/specs/2026-09-03-codewiki-design.md (reachable)
Implementers: opus (user instruction). Reviewers: opus for large diffs, sonnet for small/scoped.

## Preflight conflict scan (2026-09-03)

| Pair / task | Produces vs consumes | Finding |
|---|---|---|
| T1 CI ↔ T13/T19 | CI calls `pnpm vendor:pyodide`, `test:e2e`, `lhci autorun` before those exist | CONFLICT → Ruling below |
| T2 tokens ↔ T1 tailwind vite plugin | `@import 'tailwindcss'` + `@theme inline` in tokens.css; global.css imports it | consistent |
| T4 `t(locale,key,vars)` ↔ T8–T12, T17 | same signature everywhere | consistent |
| T5 `TRACKS/getTrack/HOME_TRACKS` ↔ T6 schema enum, T9, T10 | same names | consistent |
| T6 file list says `glossary/terms.yaml` (file loader) but steps say one YAML per term (glob) | inconsistent inside T6 | Ruling below |
| T6 `getTopic` uses `getEntry('topics', id)` with generateId `track/slug/lang` | matches `parseTopicId` | consistent |
| T7 og path ↔ T18 `ogPaths()` | `/og/python/closures.png`, `/og/zh/python/closures.png`, `/og/home.png` | consistent |
| T9 static palette markup ↔ T15 Palette island | T9 renders server-side sample panel; T15 island | consistent (no shared code required) |
| T11 remark-depth (counts) ↔ T12 step 5 (wrapping standard blocks) | T12 assigns wrapping to remark-depth | Ruling below |
| T11 codebox markup `data-run="true"` ↔ T13 selector `figure.codebox[data-run]` | consistent |
| T11 copy script placement (Base) ↔ T8 Base | T11 modifies Base | consistent |
| T16 `.md` endpoint uses `entry.body` | content layer exposes body | consistent |
| Global "no raw hex in components" ↔ T18 satori JSX colours | build-time renderer, not a component | Ruling below |
| Each task self-consistency (tests vs code, files created vs touched) | checked T0–T19 | no contradictions found |

Rulings:
- Ruling: T1 CI workflow contains only install, lint, check, test, build; T13 adds `vendor:pyodide` (as `prebuild`), T19 adds e2e + lhci steps — why: CI must stay green between tasks — cost if wrong: one extra edit of ci.yml later.
- Ruling: glossary is one YAML file per term under `src/content/glossary/` loaded with `glob` (T6 steps win over the file-structure list) — why: avoids the uncertain `file()` parser option — cost if wrong: a loader change in one file.
- Ruling: `remark-depth` (T11) both counts words per level AND wraps runs of non-Depth blocks in `<div data-depth="standard">`; T12 relies on that markup — why: deterministic CSS-only depth switching — cost if wrong: plugin rewrite.
- Ruling: hex colours are allowed in `src/lib/og.ts` (build-time image) and `tokens.css` only — why: satori cannot read CSS variables — cost if wrong: none.
- Ruling: content prose (sample topics, glossary definitions, quiz questions, zh UI strings) is written by Codex, never by Opus implementers (user rule) — cost if wrong: none.

## Task log
- Task 0: implemented (commit 1c4106c, DONE_WITH_CONCERNS: three API uncertainties recorded in docs/dev/astro7-notes.md); review dispatched (sonnet).
- Task 0: minor (deferred): grouped Source lines cover several snippets; endpoint typing 'ambiguity' is the brief's assumption not the docs'; stray 'Before:' comment in compressHTML snippet; small scope creep (version table, preact appendix).
- Task 0: complete (commits 518e01f..1c4106c, review clean)
- Task 1: dispatched (opus) at BASE 1c4106c.
- Task 1: implemented (commit 9c867da, DONE_WITH_CONCERNS). Ruling: eslint ^10 accepted (plugin peer requires it). Ruling: compressHTML true accepted provisionally, re-check at Task 8. Ruling: .prettierignore for docs/prompts/lockfile accepted. Ruling: sitemap locale codes must be { en: 'en', zh: 'zh-Hans' } per spec §3.4 (fix in review loop). Ruling: pnpm.onlyBuiltDependencies accepted; extend for future native deps.
- Task 1: review (sonnet) → spec ❌ sitemap locales en-US/zh-CN vs spec en/zh-Hans (Important); minors: compressHTML addition noted, jsx-a11y absent. Fix round 1/5 dispatched to original implementer (FIX_BASE 9c867da).
- Task 1: fix round 1/5 (1 addressed, 0 open — sitemap locales; commits 9c867da..7ee61e3). Note for T7/T8: @astrojs/sitemap emits no x-default; head must emit <link rel=alternate> for en/zh-Hans/x-default (already in T7 buildHead).
- Task 1: complete (commits 1c4106c..7ee61e3, review clean after 1 fix round)
- Task 2: implemented (commit 7178ba0, DONE; note: Base layout must set html lang zh-Hans for zh). Review dispatched (opus).
- Task 2: minor (deferred): unguarded localStorage in ThemeToggle click; readThemePref crashes on 'null' payload; SSR icon/aria-label wrong until idle; no aria-live announce; @theme inline font self-reference could be dropped; syntax classes may be dead once Shiki css-variables lands (T11 to confirm); .codebox overflow hidden vs pre needs overflow-x auto (T11); .zh font rule not copied; theme test does not lock merge behaviour.
- Task 2: complete (commits 7ee61e3..7178ba0, review clean)
- Task 3: implemented (commit 0cde7ac, DONE_WITH_CONCERNS: fontsource as devDeps accepted; preload link → T8; CJK metric overrides unmeasured (accepted, tune later)). Review dispatched (sonnet).
- Task 3: minor (deferred): fetch-fonts writes non-atomically (temp+rename); format('woff2') vs 'woff2-variations' note; preload hint → T8.
- Task 3: complete (commits 7178ba0..0cde7ac, review clean)
- Task 4: implemented (commit 00bafab, DONE; 129 keys, zh placeholders). Review dispatched (sonnet); Codex translate-ui run started in parallel.
- Task 4: minor (deferred): home.eyebrow lacks the mockup's '// ' prefix — Ruling: the prefix is template chrome rendered by the Home component (T9), not dictionary copy; settings/search/notFound copy has no mockup source.
- Task 4: complete (commits 0cde7ac..00bafab, review clean); zh translation by Codex pending (log: codex-translate-ui.log).

- Task 4 (Codex): zh UI copy translated by Codex (TRANSLATE-UI DONE), prettier applied by controller, commit 02b31ad.
- Task 5: implemented (commit e6dd9cf). Ruling: brief's test 'name.zh !== name.en for every track' conflicts with 'Latin names for languages' → languages keep bare Latin zh names; assertion applies only to non-language tracks — cost if wrong: one data edit. Fix requested before review.
- Task 5: ruling applied (commit 5412830). Review dispatched (sonnet) over 02b31ad..5412830.
- Task 5: minor (deferred): Postgres/PostgreSQL naming asymmetry; Section.description unused; track descriptions are implementer copy (editorial review later).
- Task 5: complete (commits 02b31ad..5412830, review clean)
- Task 6: dispatched (opus) at BASE 5412830.
- Task 6: implemented (commit 6766aef, DONE; controller clarified the Codex brief in 0bd187c). Review dispatched (opus); Codex write-sample-topics run started in parallel.
- Task 6: review (opus) → Important: glossary short ≤140 not enforced; minors: listTopics localeCompare without lang, section regex duplicated, terms/quiz untyped, fixtures test does not cross-check terms/quiz existence, empty outcomes/sources titles allowed, Codex brief allows title/description edits. Fix round 1/5 dispatched to original implementer (FIX_BASE 6766aef).
- Task 6: fix round 1/5 (1 addressed pending re-review; commits 6766aef..79f2810). Re-review dispatched (sonnet).
- Task 6: minor (deferred): listTopics localeCompare should pass lang; section regex duplicates shared slug; terms/quiz could be typed refs; fixtures test could cross-check terms/quiz existence; empty outcomes/source titles allowed; Codex brief permits title/description edits.
- Task 6: complete (commits 5412830..79f2810, review clean after 1 fix round); Codex sample content pending.
- Task 7: implemented (commit 80917f0, DONE). Review dispatched (sonnet).
- Task 7: minor (deferred): no trailing-slash normalisation in buildHead; publisher/provider objects duplicated; extra exports formatTitle/ogImageUrl.
- Task 7: complete (commits 79f2810..80917f0, review clean)
- Codex samples committed (153d36d): structure per standard, code outputs real, zh natural; style issue: one sentence per paragraph → standard amended (6f04528). TODO: Codex reflow pass on the 4 sample files after Task 8. Task 8 dispatched (opus) at BASE 6f04528.
- Task 8: implemented (commit e3b3c27, DONE; concerns: duplicate ThemeToggle islands go stale, 404 hreflang to nonexistent /zh/404/, extra i18n keys nav.primary/nav.menu/a11y.skip). Review dispatched (opus).
- Task 8: review (opus) → Important: nav overlaps search in 768–1000px band (Ruling: compact layout below 1024px); minors: JSON-LD '<' escaping, LangSwitch lang/hreflang, dead CSS declaration (all in fix round), deferred: duplicate NavLinks markup, duplicate ThemeToggle island stale glyph, buildHead should drop alternates when noindex (T17/T19), Button index signature, Icon default branch, favicon currentColor. Fix round 1/5 dispatched to original implementer (FIX_BASE e3b3c27).
- Codex reflow pass done (REFLOW DONE), committed a7c5233; paragraphs now 2–5 sentences, en/zh blank-line counts equal.
- Task 8: fix round 1/5 committed (9f24f79). Ruling: compression band 1024–1199px accepted (keeps desktop nav on landscape tablets) — cost if wrong: tighter gaps at those widths. Re-review dispatched (sonnet).
- Task 8: minor (deferred): Footer other-locale link lacks lang/hreflang; compression band tuned for English labels; details menu does not close on outside click; plus earlier deferred items.
- Task 8: complete (commits 6f04528..9f24f79, review clean after 1 fix round)
- Task 9: implemented (commit ca0a9df). Designer check (Fable) of 1440 light/dark + zh screenshots: matches mockups; minor: version chips wrap to 2 lines, track sub lines use descriptions instead of section lists (accepted). Review dispatched (opus).
- Task 9: review (opus) → Important: flushStore drops pending write; minors: readStore shape validation, duplicate interpolation, unused pagefind 'body' branch, §6.2 size guard not implemented (deferred to T17), KEYS/PREFS_KEY test, titles prop growth, a11y nits, English chips on zh palette, pstrip grid. Fix round 1/5 (flushStore + guards + test + a11y/grid) dispatched to original implementer (FIX_BASE ca0a9df).
- Task 9: fix round 1/5 committed (f50097c). Re-review dispatched (sonnet).
- Task 9: minor (deferred): duplicate placeholder interpolation, unused pagefind 'body' branch in Base, §6.2 storage size guard not implemented (→T17), titles prop grows with topics, palette chips English on zh, lone continue card stretches full width, getContinue assumes object entries.
- Task 9: complete (commits 9f24f79..f50097c, review clean after 1 fix round)
- Task 10: implemented (commit 8e5a847). Designer check (Fable): matches TrackHub mockup; populated sections listed before collapsed empty ones (accepted); 'Interview bank' wraps in the 4-col quick links (minor). Review dispatched (opus).
- Task 10: review (opus) → Important: filter segments keyboard-unreachable (roving tabindex without arrow keys); minors: topics in unregistered sections vanish (→ note for content check), Read filter includes partial, Seg index signature, dead .ic CSS, stale comment, effect deps, playwright env. Fix round 1/5 dispatched (FIX_BASE 8e5a847).
- Task 10: fix round 1/5 committed (50dee31). Re-review dispatched (sonnet).
- Task 10: minor (deferred): topics with unregistered section slugs vanish silently (add a content check in P0 check.ts: section must exist in tracks.ts); Seg index signature; dead .ic CSS; effect deps; playwright env.
- Task 10: complete (commits f50097c..50dee31, review clean after 1 fix round)
- Task 11: dispatched (opus) at BASE 50dee31.
- Task 11: implemented (commit cb8b71f; Shiki transformer path works; readingTime en 1/9/11). Concerns: Checkpoint hidden in Quick (ruling: must stay visible in every mode — fix in loop), Depth slot via set:html (islands inside Depth — verify), env.d.ts wildcard. Review dispatched (opus).
- Task 11: review (opus) → Important: Checkpoint wrapped as standard (hidden in Quick); depth wrappers have no flex layout (spacing collapse). Minors: data-highlight not propagated, dataLanguage vs data-language fallback, clipboard no catch, bare fence → output box, env.d.ts wildcard, English labels in zh static HTML (accepted consequence), orphan .code rule, test gaps. Depth set:html islands note (accepted for P1). Fix round 1/5 dispatched (FIX_BASE cb8b71f).
- Task 11: fix round 1/5 committed (cf8b53e; 24px gap, selector scoped to section/div wrappers — accepted). Re-review dispatched (sonnet).
- Task 11: minor (deferred): data-highlight not propagated to figure; bare fences render as output boxes; env.d.ts wildcard; English labels in zh static HTML until swap (no-JS/Pagefind see English); Depth uses slots.render+set:html (islands inside Depth would not hydrate — revisit in P2); test gaps (nested callouts, inline marker text, localeOfPath).
- Task 11: complete (commits 50dee31..cf8b53e, review clean after 1 fix round)
- Task 12: implemented (commit 3176c06; 13 e2e). Designer check (Fable) of the topic header/TL;DR/TOC crop and full-page light/dark: matches Topic.dc.html (meta panel with transparency line, depth tabs, deep items dimmed in TOC). Review dispatched (opus).
- Task 12: review (opus) → Important: readPct counts depth-hidden h2s (checkpoint-less topics never complete). Minors: transparency line hidden for drafts, inert path progressbar, breadcrumb trail differs from LD, isDone/checkIcon duplicated across islands, depth.ts re-declares prefs constants, disabled buttons' title not reachable, hasCheckpoint string check, TOC getElementById per frame. Fix round 1/5 dispatched (FIX_BASE 3176c06).
- Task 12: fix round 1/5 committed (683adcf: visible-section readPct, monotonic, scroll re-evaluation; unified breadcrumb trail; decorative path bar). Re-review pending (dispatch scoped re-review over 3176c06..683adcf if this line is the last Task 12 entry).
- Task 12: minor (deferred): TrackHub path card still has static progressbar role (fix in T19 sweep); ReadTracker imports DEPTH_EVENT from DepthDial (bundle note); section slug 'main' would collide with #main.
- Task 12: complete (commits cf8b53e..683adcf, review clean after 1 fix round)
- PARALLEL MODE (user request 2026-09-04): P1 Tasks 14–18 dispatched concurrently on branches p1-t14-glossary, p1-t15-search, p1-t16-askai, p1-t17-endpoints, p1-t18-og (worktrees .worktrees/p1-<branch>, all from 683adcf); Task 13 continues on p1-site-foundation. Each gets task review on its own branch, then the controller merges into p1-site-foundation (resolving dictionary/CSS appends). Ruling: T14 adds pagefind attributes to glossary pages itself; T18 og.ts fetches fonts lazily (no prebuild edit); shared files edited append-only.
- Task 13: implemented (commit b7767e7; 19 e2e; Python cold 26 s). Ruling: synchronous infinite loops freezing the tab is an accepted P1 limitation (worker-based runners in P2); esbuild.wasm vendoring accepted. Review pending (dispatch over 683adcf..b7767e7).
- Task 13: minor (deferred): plaintext-only fallback dead (needs try/catch); drain 4500 ms near budget; concurrent Python runs share streams; innerText fallbacks unreachable; unsupported-lang undo; hasRunnable heuristic.
- Task 13: WATCH for T19: CSP must allow 'unsafe-eval' for /sandbox.html (new Function) — scope via a per-path _headers rule for /sandbox.html; keep 'wasm-unsafe-eval' for the rest.
- Task 13: complete (commits 683adcf..b7767e7, review clean)
- Task 14: implemented on p1-t14-glossary (commit 249a1cf; 21 e2e). Review dispatched (opus).
- Task 14: minor (deferred): breadcrumb pill vs LD name differ (id vs display name), duplicate nav label, duplicated sort, no touch path, no resize handler.
- Task 14: complete on p1-t14-glossary (683adcf..249a1cf, review clean); merging into p1-site-foundation.
- Merged p1-t14-glossary into p1-site-foundation (804e663): lint/check/test/build green.
- Task 17: implemented on p1-t17-endpoints (commit 648f9a2; 27 e2e). Review dispatched (opus).
- Task 18: implemented on p1-t18-og (commit 20c0585; 4.6 s build cost). Review dispatched (sonnet).
- Task 18: designer check (Fable): en and zh OG cards approved (glyph tag, title, subtitle, wordmark, accent bar; CJK renders).
- Task 17: review (opus) → Important: font size applies only to .prose p; minors: import input value reset, unguarded localStorage in island, revokeObjectURL timing, redundant guid customData, settings in sitemap (T19 filter), dead tie-break, llms-full trailing newline, export filename date. Fix round 1/5 dispatched (FIX_BASE 648f9a2).
- Task 16: implemented on p1-t16-askai (commit 370cb04; rehypeHeadingIds moved first — verify idempotent). Review dispatched (opus).
- Task 18: review (sonnet) → Important: no tests for degraded-font branches (CJK missing → tofu; nothing → placeholder). Minors: quiet flag partial, 72px vertical padding, endpoint cast. Fix round 1/5 dispatched (FIX_BASE 20c0585).
- Task 15: implemented on p1-t15-search (commit fe2a8aa; fixed Base pagefind meta pairs; mergeIndex for language toggle). Review dispatched (opus).
- Task 17: fix round 1/5 committed (f6c8759; .prose p edit at original cascade position accepted). Re-review dispatched (sonnet).
- Task 18: fix round 1/5 committed (1989d51). Re-review dispatched (sonnet).
- Task 17: minor (deferred): revokeObjectURL timing, redundant guid customData, settings pages in sitemap (T19), dead tie-break, llms-full trailing newline, export filename UTC date.
- Task 17: complete on p1-t17-endpoints (683adcf..f6c8759, review clean after 1 fix round); merging into p1-site-foundation.
- Merged p1-t17-endpoints into p1-site-foundation (a80b5b6); append conflicts in en.ts/zh.ts/global.css resolved by keeping both sides (one split CSS rule re-closed); lint/check/test/build green.
- Task 16: review (opus) → Important: deep-link truncation by source chars → zh URLs ~38 KB (ruling: budget encoded query ≤ 8000); minors: Callout/TLDR containing fences lose labels in twin, multi-paragraph callouts collapsed, column-0 fences only, dead isTeaser guard, clipboard undefined, memo builds prompts early, no focus trap (accepted popover), sec-ask before hydration, -18px magic. Fix round 1/5 dispatched (FIX_BASE 370cb04).
- Task 18: minor (deferred): warnOnce registry order-dependent in tests (add reset), SemiBold-only path untested.
- Task 18: complete on p1-t18-og (683adcf..1989d51, review clean after 1 fix round); merging.
- Merged p1-t18-og into p1-site-foundation (63a295d): green.
- Task 15: review (opus) → Important ×3: Enter swallowed panel-wide (toggle/esc keyboard-dead), useId collision on /search/, excerpt injected as raw HTML; minors: glyph tag, double ⌘K opener overwrite, no inert background, silent mergeIndex failure, scroll-lock shift, mutable GROUP_ORDER. Fix round 1/5 dispatched (FIX_BASE fe2a8aa). Note: pagefind meta pairs() rewrite verified correct against pagefind 1.5.2.
- Task 16: fix round 1/5 committed (7d55994). Re-review dispatched (sonnet).
- Task 15: fix round 1/5 committed (15bb18f). Re-review dispatched (sonnet).
- Task 16: minor (deferred): multi-fence callouts untested, line-wrapped opening tags, no unit test for clipboard-undefined branch, .sec-ask placement, domain-track language label.
- Task 16: complete on p1-t16-askai (683adcf..7d55994, review clean after 1 fix round); merging.
- Task 16: merged into p1-site-foundation (lint/check/test/build green).
- Task 15: minor (deferred): Tab-focused rows do not sync active/aria-selected; nested literal <mark> in prose renders as highlight (accepted concession).
- Task 15: complete on p1-t15-search (683adcf..15bb18f, review clean after 1 fix round); merging.
- Task 15: merged into p1-site-foundation (lint/check/test/build green; global.css rebuilt as HEAD + T15 append because git interleaved .palette-lang/.seg rules).
- Task 19: dispatched (opus) on p1-site-foundation, BASE faabc37. Rulings carried: no STATUS.md edit on branch (controller owns it on main); CSP 'unsafe-eval' scoped to /sandbox.html; settings+search filtered from sitemap; TrackHub static progressbar role removed; buildHead drops alternates when noindex; ci.yml gains e2e+lhci; script budget may downgrade to warn with measured size reported.
- Sweep V1 (visual QA by Fable on faabc37, screenshots in scratchpad/shots2): findings → nav links to 5 non-existent P2 pages (/paths/ /practice/ /cheatsheets/ /compare/ /playground/), TrackCard misaligned titles (center-aligned rows, variable glyph width), topic controls overflow at 390px, hub tool labels wrap, glossary index page indexed as a term, TOC/Quick consistency to verify. Dispatched as branch p1-visual-sweep (worktree .worktrees/p1-visual-sweep, BASE faabc37, opus) in parallel with Task 19. Deferred: glossary excerpt repeats the title.
- Sweep V1: implemented (9080d23 on p1-visual-sweep, DONE_WITH_CONCERNS: tool-card floor 190px not 170; topic .body gutter restored <1024; Checkpoint visible at all depths so TOC is consistent; /about/ footer link removed until an About page exists; search.spec.ts strict-mode failures pre-existing on faabc37 — Task 19 or final sweep must fix; stray preview server from p1-t14-glossary was holding :4321). Review dispatched (opus).
- Task 19: implemented (a734c3e, DONE_WITH_CONCERNS: desktop Lighthouse preset because mobile CLS 0.182 is a Lighthouse artefact; colour contrast fails WCAG AA on 10 token pairs — design decision, recorded as test.fixme + color-contrast warn; TrackHub progressbar role kept because TrackProgress writes aria-valuenow (ruling 4 exception); buildHead drops alternates on noindex; search.spec strict-mode fixed; hrefless <a> → <span>; courseLd wired into TrackHub; _headers most-specific-wins assumption unverified until first deploy). Review pending.
- Ruling: contrast fix is a Fable design task after the P1 merge — re-pick --ink3 (light #6b7180 / dark #98a2c0), --ok, --warn and Shiki comment tokens to reach 4.5:1 on their backgrounds; drop the opacity on .toc a.deep in favour of a token colour. Cost if wrong: one token pass.
- Sweep V1: review (opus) → Approved; Important: check-dist-links accepts extensionless paths without trailing slash (latent hole); minors: PersonalStrip reviewUrl /practice/flashcards/ not behind P2_NAV, 404 og:image target missing (23 og images missing site-wide — og endpoint only builds topics/tracks?), HeadModel mutated post-hoc in 404.astro, stale 170px comment, .also-soon align, regex over raw HTML, 'Start a path' copy. Ruling: fix Important 1 + minors 2, 5 now (fix round 1, same implementer); defer 3 (og coverage → final review; check src/pages/og/[...path].png.ts getStaticPaths), 4, 6, 7, 8.
- Task 19: review dispatched (opus), package faabc37..a734c3e.
- Sweep V1: fix round 1 done (878f5c7). Scoped re-review dispatched (sonnet).
- Sweep V1: complete on p1-visual-sweep (faabc37..878f5c7, review clean after 1 fix round). Merge into p1-site-foundation after the Task 19 review finishes (its reviewer is using that worktree).
- Ruling (calibration): the editorial standard allows one Mermaid diagram per topic but the site has no Mermaid renderer → add P1 Task 20 'build-time Mermaid diagrams' (rehype-mermaid, inline SVG, themeCSS bound to tokens so both themes work) before the final P1 review. Cost if wrong: diagrams render as code blocks until fixed.
- Task 20 (Mermaid): dispatched to Codex on branch p1-t20-mermaid (worktree .worktrees/p1-t20-mermaid, BASE faabc37, brief task-20-codex.md, log scratchpad/codex-task20.log). Routing change 2026-09-04: implementation and routine reviews go to Codex; Fable reviews the result.
- Task 19: review (opus) → Needs fixes. Important: theme-toggle e2e hydration race (client:idle) fails ~50%; mobile CLS 0.18 on /python/closures/ is a real shift of .col (reproduced without emulation) so preset:desktop must go and deploy.md's claim is false. Minors: search dialog flake after Escape, sitemap regex unanchored, a11y fixme loop, CI relies on system Chrome, reuseExistingServer trap. Ruling: fix all 7 (fix round 1 → Codex, brief task-19-fix1-codex.md); keep mobile preset; CLS gate may be warn ≤0.1 with perf ≥0.9 if the root cause is not fully removable.
- Design D1 (contrast, Fable 2026-09-04): light --ink3 #7b8190→#676d7c, --ok #0f8a5f→#0e7c56, --warn #b4540a→#b2530a, code --c #565f89→#717aa6; dark passes already; drop text opacity (.toc a.deep 0.7 → color token). Brief design-d1-contrast-codex.md ready; dispatch to Codex on p1-site-foundation after Task 19 fix + sweep merge land.
- Task 19: fix round 1 by Codex (uncommitted because port 4321 was transiently busy at its final check); Fable reviewed the diff (TOC pre-paint collapse via inline flag + CSS; Palette hidden sync; sitemap anchor; CHROME_PATH; reuseExistingServer false) and ran the full gate: lint/check/212 tests/build/e2e 78 passed 2 skipped/lhci no failures → committed as 09d4913. Task 19: complete.
- Sweep V1: merged into p1-site-foundation (82d9935); TrackHub conflicts resolved by hand (Task 19 span-not-anchor for soon shortcuts + sweep quick-label span; sweep also-soon rows; stale HEAD rule dropped); gate + track/layout/topic e2e green.
- Design D1: dispatched to Codex on p1-site-foundation (BASE 82d9935, brief design-d1-contrast-codex.md, log codex-d1-contrast.log).
- Task 20 (Mermaid): complete on p1-t20-mermaid (faabc37..0d9d90d; Codex, Fable design review of screenshots: sequence/flowchart/class diagrams token-styled in both themes, natural size after fix round 1). Merge into p1-site-foundation after Design D1 lands (same worktree busy).
- Design D1: complete (d08a9f1; Codex; Fable reviewed screenshot + report: 4 light tokens applied, palette selected-row meta moved to --ink2 for 4.5:1, toc deep opacity removed, mockups updated incl. p2 tree restored from main 55c304a; e2e 92 incl. un-skipped contrast tests; lhci 0 failures).
- Task 20: merged into p1-site-foundation (795af17, clean merge).
- Final whole-branch review dispatched to Codex on p1-site-foundation (795af17; brief final-review-codex.md, log codex-final-review.log).
- Final review (Codex) → Not ready: 6 Important (Cloudflare merges _headers rules so sandbox gets two CSPs; 23 advertised og:image files missing; /search/ indexable; prefs null/throw paths unsafe + theme storage duplicated; term tooltip link unreachable by keyboard; 4 English labels on /zh/), 8 minors. Rulings: fix all 6 + minors 2,3,5,7,8; defer minors 1 (DOM-rewrite localisation → P2), 4 (sentinel placement intentional), 6 (sitemap lastmod). Fix round 1 → Codex (brief final-fix1-codex.md, log codex-final-fix1.log).
- Final fix round 1 done by Codex (5928221; 224 unit, 99 e2e, 1112 link targets incl. og:image, lhci pass). Scoped re-review dispatched (Codex, brief final-rereview-codex.md).
- Final review: clean after 1 fix round (5928221; Codex re-review: 11/11 addressed, no new breakage). P1 plan complete — merging p1-site-foundation into main.
