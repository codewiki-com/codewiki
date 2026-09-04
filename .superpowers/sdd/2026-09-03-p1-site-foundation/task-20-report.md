# Task 20 report — build-time Mermaid diagrams

## Result

Mermaid fences now become token-styled inline SVG figures during Astro's build. The shipped topic
pages add no Mermaid client JavaScript, ordinary highlighted fences still use the existing codebox,
and Markdown twins retain the authored Mermaid source fence.

## Step 1 — renderer and Markdown pipeline

- Added `rehype-mermaid@3.0.0` as a development dependency with `pnpm add -D rehype-mermaid`.
- Added `@fontsource/ibm-plex-sans@5.3.0` as a development dependency with
  `pnpm add -D @fontsource/ibm-plex-sans`. The brief's exact renderer option points to
  `node_modules/@fontsource/ibm-plex-sans/400.css`; the repository previously had only the variable
  package, so this static package is required for that URL to exist.
- Added `src/markdown/mermaid.ts`. It calls `rehypeMermaid` with `strategy: 'inline-svg'`, the
  specified base theme, font stack, 14px theme variable, and Fontsource CSS URL. Before rendering it
  wraps each Mermaid code block in
  `<figure class="diagram" role="img" aria-label="{first source line}" data-diagram>`. After rendering
  it marks the generated SVG with `data-diagram` and records a responsive minimum width derived from
  its viewBox so rendered labels do not shrink below 12px.
- Registered that plugin before `rehypeCodebox` and excluded `mermaid` from Shiki in
  `astro.config.mjs`, leaving the fence as `pre > code.language-mermaid` for rehype-mermaid.
- Tightened `rehypeCodebox` to operate only on a `pre` with a direct code child.
- Added `tests/fixtures/mermaid.mdx` with `sequenceDiagram`, `flowchart LR`, `classDiagram`, and a
  Python fence. Unit coverage confirms three `figure.diagram > svg` results, accessible names, no
  remaining Mermaid code block, and an unchanged Python `pre > code`.
- A temporary reviewed topic using the same four fences was built for integration checks and
  screenshots, then deleted before commit.

Built HTML inspection found three diagram figures and SVGs, zero Mermaid `pre`/language classes,
one normal Python codebox, and no Mermaid runtime script. The temporary topic's Markdown twin
contained all three Mermaid fences.

## Step 2 — token styles and responsive checks

- Added `src/styles/mermaid.css` and imported it from `global.css`.
- Added the diagram surface/layout rules to `global.css`.
- Implemented the requested node, label, edge, marker, note, and activation token overrides.
- Checked the class names emitted by Mermaid 11 for all three fixture diagrams and added its current
  `.flowchart-link`, `.arrowMarkerPath`, `.relation`, `.node .outer-path path`, divider, HTML-label,
  and marker-path selectors.
- Prevented the site's prose paragraph size from resizing Mermaid `foreignObject` labels after
  layout, and allowed the bold class labels to use the node's existing padding without clipping.
- Playwright checks at 1440x1000 and 390x844 found three diagrams, no diagram `pre`, no page-level
  horizontal overflow, token-matched light/dark text, and a minimum effective rendered label size of
  14.00px at 1440 and 12.02px at 390. Wide mobile diagrams scroll within their figure once the 12px
  floor is reached.

Screenshots (Playwright browser contexts used `colorScheme: 'light'` and `colorScheme: 'dark'`):

- `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-mermaid/mermaid-light-1440.png`
- `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-mermaid/mermaid-dark-1440.png`
- `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-mermaid/mermaid-light-390.png`
- `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-mermaid/mermaid-dark-390.png`

## Step 3 — Markdown twin

- Made Mermaid preservation explicit in `convertFence`: a Mermaid fence returns unchanged rather
  than entering codebox-meta conversion.
- Added a focused twin unit test.
- The final site still emits the same `llms-full.txt` route and document shape. No real topic source
  changed.

## Step 4 — build time and client budget

Wall time was measured with GNU `time`; Astro's own reported duration is included for context.

| Build | Pages | Wall | Astro | Delta from baseline |
| --- | ---: | ---: | ---: | ---: |
| Before changes, current site | 73 | 13.03s | 10.74s | — |
| Final code, current site | 73 | 6.90s | 5.49s | -6.13s |
| Final code plus temporary topic with three Mermaid diagrams | 74 | 10.32s | 8.68s | -2.71s |

The runs were sequential on a development machine, so later runs benefited from warm filesystem and
rendering caches; the negative delta is not claimed as a speedup. The useful comparison is that the
three-diagram fixture added 3.42s over the warmed no-diagram build and remained well inside the
+20s requirement.

`rg -i -l 'mermaid' dist/_astro/*.js` returned no matches after the fixture build, confirming the
renderer was not added to client bundles. This branch has no `lighthouserc.json`, so there was no
Lighthouse configuration to rerun; the topic script budget is unchanged by construction and by the
built-bundle inspection.

## Verification commands

```text
/usr/bin/time -f 'BASELINE_WALL_SECONDS=%e' pnpm build
pnpm exec vitest run tests/unit/markdown.test.ts tests/unit/markdown-twin.test.ts
pnpm check
pnpm exec astro build
pnpm preview --port 4321
pnpm exec playwright test tests/e2e/topic.spec.ts
pnpm lint && pnpm check && pnpm test && pnpm build
/usr/bin/time -f 'FINAL_WALL_SECONDS=%e' pnpm build
/usr/bin/time -f 'FINAL_FIXTURE_WALL_SECONDS=%e' pnpm build
git diff --check
```

The final gate passed: Prettier/ESLint clean, Astro/TypeScript 0 errors, 22 unit files and 215 tests
passed, and 73 static pages built. The focused topic E2E suite passed all 16 tests.

The first Playwright E2E invocation saw Astro's coding-agent-aware preview command daemonize and
therefore reported that the configured web server exited early. The preview was healthy on port
4321; rerunning the exact Playwright command reused it and passed. Screenshot preview initially used
4322 because 4321 was occupied by that background preview. All preview/browser processes were
stopped afterward.

## Deviations and unverified items

- The temporary topic was removed as required; the committed fixture lives only under
  `tests/fixtures/` and is rendered inside an existing topic shell by the E2E test, so no test-only
  route is published.
- No Lighthouse run was possible because this branch does not contain its planned configuration.
  No other acceptance item is unverified.
