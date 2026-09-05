# Verification panel on topic pages — design note

Design lead, 2026-09-05 (ROADMAP A3). Extends `MetaPanel.astro`; the transparency line there ("drafted with AI, verified by running the code, reviewed on …") stays and gains checkable facts.

## Intent

"Every example was executed" becomes something a reader can inspect on the page: which exact runtime, when, how many output blocks matched, and what the in-browser runner is (it is not the same environment). No claim on the page is stronger than the data behind it.

## Data (produced by the checker, read by the build)

`pnpm content:check {track}/{slug}` writes `reports/verify/{track}/{slug}.json` (committed; one file per topic, both languages share it because the code is identical):

```json
{
  "topic": "python/closures",
  "checkedAt": "2026-09-05T02:11:09Z",
  "runtime": { "name": "Python", "version": "3.14.2", "tool": "python3.14" },
  "blocks": { "runnable": 4, "executed": 4, "matched": 4, "skipped": 0 },
  "results": [ { "id": "b3", "title": "label_factory.py", "status": "matched" } ],
  "checker": "content:check@<git sha>"
}
```

`runtime.version` is the real `--version` output of the tool that ran (patch version), not the frontmatter pin; `blocks.matched` counts blocks whose recorded output equals the fresh run. `skipped` are blocks marked non-runnable (`nocheck`). The build fails if a `reviewed` topic has no sidecar; a topic whose sidecar shows `matched < executed` builds but renders the mismatch state (see below), so drift is visible rather than hidden. The old `verified` frontmatter field remains the human sign-off date; the panel shows both.

The in-browser runner versions come from the vendored packages at build time: Pyodide (`public/vendor/pyodide/package.json` → its Python version, e.g. "Pyodide 0.28 · Python 3.13"), esbuild-wasm version, sql.js's SQLite version.

## Panel (inside `.panel.meta`, after the existing key/value grid)

```
┌────────────────────────────────────────────────────────────────┐
│ level  intermediate    time  12 min    checked  Python 3.14    │  ← existing grid
├────────────────────────────────────────────────────────────────┤
│ ✓ VERIFIED   Python 3.14.2 · 4 of 4 outputs matched · Sep 5    │
│   Reviewed by an editor Sep 4 · drafted with AI                │
│   In your browser: Pyodide 0.28 (Python 3.13) — outputs may    │
│   differ from the recorded Python 3.14 run.          details ▸ │
└────────────────────────────────────────────────────────────────┘
```

- Line 1: a 14 px row; state glyph and word in `--ok` (`✓ VERIFIED`) when `matched === executed`; `--warn` (`△ N OF M MATCHED`) when not; `--ink3` (`○ NOT RUN`) when the topic has no runnable blocks. Then runtime name + patch version, the match count, the `checkedAt` date (locale-formatted, day precision).
- Line 2: the existing transparency sentence, shortened to one line: reviewed date + "drafted with AI".
- Line 3 (only when the page has runnable blocks in the browser): the runner and its language version, and the one-sentence caveat. When the runner's language version equals the recorded runtime's major.minor, the caveat is omitted ("Runs in your browser with esbuild 0.28").
- `details ▸` is a `<details>` disclosure listing every runnable block (title, status) with anchors to the blocks. No JavaScript.

## Per-block label

Every runnable fence's toolbar (where the Run button is) shows a `.lbl` at the right: "recorded on Python 3.14.2" and, when the browser runner differs, "runs here on Python 3.13". Non-runnable blocks (Go, Rust, Java, C++, …) show only "recorded on Go 1.27.1".

## Mobile

Same panel; line 1 wraps to two lines; the details list becomes full width.

## Copy (English; Chinese by the implementer)

`verify.verified` "Verified", `verify.partial` "{matched} of {executed} matched", `verify.notRun` "Not run", `verify.outputs` "{matched} of {executed} outputs matched", `verify.reviewed` "Reviewed by an editor {date} · drafted with AI", `verify.browser` "In your browser: {runner} — outputs may differ from the recorded {runtime} run.", `verify.browserSame` "Runs in your browser with {runner}.", `verify.details` "Verification details", `verify.recordedOn` "recorded on {runtime}", `verify.runsHere` "runs here on {runner}".

## Out of scope here

The scheduled re-verification workflow (ROADMAP B5) will refresh the sidecars; this note only makes the data and the panel exist.
