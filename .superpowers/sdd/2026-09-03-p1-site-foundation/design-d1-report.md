# Design pass D1 report - WCAG AA contrast tokens

Worktree: `/home/chen/githubprojects/codewiki/codewiki/.worktrees/p1-site-foundation`

Branch: `p1-site-foundation`

Status: **DONE**

## Palette and text treatment

The light `:root` palette in `src/styles/tokens.css` now uses the four values approved by the
design lead:

| token | old | new |
| --- | --- | --- |
| `--ink3` | `#7b8190` | `#676d7c` |
| `--ok` | `#0f8a5f` | `#0e7c56` |
| `--warn` | `#b4540a` | `#b2530a` |
| `--c` | `#565f89` | `#717aa6` |

There is one light declaration of these values, so no duplicate light block needed updating.
Both dark declarations in `tokens.css` are unchanged.

The first focused axe run found one state-specific pair that was not in the approved table: the
home page's selected command-palette row puts muted metadata on `--acc-soft`.

| palette | foreground | rendered background | measured ratio | required |
| --- | --- | --- | ---: | ---: |
| light | `--ink3` `#676d7c` | `#e9ecfa` | 4.40:1 | 4.5:1 |
| dark | `--ink3` `#8b95b3` | `#1c364b` | 4.19:1 | 4.5:1 |

The smallest token-selection change is scoped to that selected row: `.row.on .row-meta` now uses
the existing `--ink2` token. The resulting ratios are 6.75:1 in light and 5.84:1 in dark. This
keeps all four approved light values exact and leaves the dark palette block untouched.

## `opacity` audit across `src/`

The original grep had two hits, both in `src/styles/global.css`. There were no opacity declarations
in component-scoped styles.

| original location | use | decision |
| --- | --- | --- |
| `src/styles/global.css:765`, `.toc a.deep { opacity: 0.7 }` | Text dimming | Replaced with `color: var(--ink3)`. The existing `deep` marker carries the state. |
| `src/styles/global.css:1332`, `@keyframes palette-in { from { opacity: 0 } }` | Non-text command-palette overlay entrance | Kept. It is a transient decoration/state animation, not a text hierarchy treatment. |

The final grep has only the `palette-in` animation hit.

## Mockups

Updated the light token block in every P1 light mockup:

- `Main.dc.html`
- `MobileHome.dc.html`
- `Path.dc.html`
- `Playground.dc.html`
- `Topic.dc.html`
- `TrackHub.dc.html`

This branch did not contain the requested `docs/design/mockups/p2/` tree at `HEAD`. The exact
approved P2 tree was restored from the local design-lead commit `55c304a`, without merging any
other `main` changes. Its `src/head.part.html` light block was updated, then
`python3 docs/design/mockups/p2/src/build.py` regenerated these seven light assemblies:

- `Bilingual.dc.html`
- `Cheatsheet.dc.html`
- `Flashcards.dc.html`
- `Interview.dc.html`
- `Kata.dc.html`
- `Practice.dc.html`
- `PromptBuilder.dc.html`

There are 13 light `.dc.html` files in total and all four old values are absent from the light
sources and assemblies. `git diff --name-only` contains no P1 dark mockup. Byte comparisons against
`55c304a` confirm `KataDark.dc.html`, `FlashcardsDark.dc.html`, and `PromptBuilderDark.dc.html` are
unchanged after the P2 build. Only the P2 shared head and seven light assemblies differ from that
approved source commit.

## Accessibility and Lighthouse

- Removed `test.fixme` from the separate `color-contrast` test. It still scans only
  `color-contrast`, over `/`, `/python/`, and `/python/closures/`, once in each theme.
- Changed Lighthouse's `color-contrast` assertion from `warn` to `error`.
- Focused result after the selected-row fix: 10 passed, 0 skipped.
- Full e2e result: 92 passed, 0 skipped.
- Final Lighthouse `color-contrast` score: 1.00 on all four audited URLs.

Final Lighthouse category scores:

| URL | performance | accessibility | best practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| `/` | 1.00 | 1.00 | 1.00 | 1.00 |
| `/python/` | 1.00 | 1.00 | 1.00 | 1.00 |
| `/python/closures/` | 0.99 | 1.00 | 1.00 | 1.00 |
| `/zh/python/closures/` | 0.99 | 1.00 | 1.00 | 1.00 |

LHCI exited 0. Its remaining warnings concern render-blocking resources on the four pages and DOM
size on the Chinese topic page; there are no contrast warnings or failures.

## Screenshots

Both files are 1440x900 PNGs captured from the fresh build with the light preference pinned before
first paint:

- `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-contrast/closures-light-1440x900.png`
- `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-contrast/python-light-1440x900.png`

## Required gate

Port 4321 was free before the focused and full e2e runs. Nothing was killed.

| command | result |
| --- | --- |
| `pnpm lint` | Pass; ESLint and Prettier clean. |
| `pnpm check` | Pass; 152 files, 0 errors, 0 warnings, one pre-existing TypeScript hint in `src/lib/runners/protocol.ts:119`. |
| `pnpm test` | Pass; 22 files, 212 tests. |
| `pnpm build` | Pass; 73 pages built and Pagefind indexed 18 pages. |
| `pnpm test:e2e` | Pass; 92 tests. |
| `pnpm exec lhci autorun` | Pass; four reports, 0 assertion failures. |

`git diff --check` is clean.

TASK DONE
