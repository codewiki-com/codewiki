# Phase A follow-up report

Date: 2026-09-05

## 1. Flagship starting-point copy

- Replaced the English flagship hint with `where to start` and removed `deep` from the tracks intro.
- Added the natural Chinese equivalents `从这里开始` and `从这 {flagship} 个方向开始，另有 {rest} 个正在持续补充。`.
- Updated the tracks e2e assertions without changing the layout.
- Commit: `fix(copy): clarify flagship tracks as starting points`.

## 2. Topic verification

- Confirmed the requested interpreter is Python 3.14.3.
- Re-ran `coordinate_index.py` and updated both tuple topic locales with the real error output: `TypeError cannot use 'tuple' as a dict key (unhashable type: 'list')`.
- Marked the wall-clock regular-expression benchmark `run nocheck` in both locales. The `run` flag remains, so the example is still runnable in the browser while exact timings are excluded from host comparison.
- Regenerated both verification sidecars and updated the topic e2e assertion for the repaired tuple state.
- `python/tuples`: 4 matched of 4 executed, 0 skipped, on Python 3.14.3.
- `foundations/regular-expressions`: 3 matched of 3 executed, 1 `nocheck` skip, on Node 24.14.0.
- Commit: `fix(content): restore reproducible topic verification`.

## 3. Home hero `llms.txt` link

- Removed the standalone hero-text link and placed `llms.txt` after the version tags in the verified chip row.
- The shared home template keeps `href="/llms.txt"` and applies both `.tag` chip styling and `.lbl` label styling in English and Chinese.
- Commit: `fix(home): place llms link with version chips`.

## Verification

- `pnpm content:check python/tuples --no-links`: passed, 4/4 executed outputs matched.
- `pnpm content:check foundations/regular-expressions --no-links`: passed, 3/3 executed outputs matched; one timing block skipped via `nocheck`.
- `pnpm lint`: passed.
- `pnpm check`: passed with 0 errors and 0 warnings; the existing `timeoutRace` async-conversion hint remains.
- `pnpm test`: 61 files and 2,423 tests passed.
- `pnpm build`: passed; 5,909 pages built and 5,750 pages indexed by Pagefind.
- `pnpm check:links`: 160,258 internal links across 5,916 pages and 6 redirect targets all resolve.
- `pnpm exec playwright test tests/e2e/home.spec.ts tests/e2e/track.spec.ts tests/e2e/topic.spec.ts`: 51 tests passed.

Existing non-failing build notices remain: Shiki falls back to plaintext for `dockerignore`; Pagefind skips six redirect-like files without an outer `html` element and does not stem `zh-Hans`; the existing `swift/fundamentals` bilingual structural-signature warning is unchanged.

Result: PASS
