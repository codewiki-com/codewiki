# Pipeline reports

Machine-generated output of the `content:*` scripts. Everything in this directory is
ignored by git except this README and `polish/state.json`, which is committed so that a
polish run can be resumed on another machine. Regenerate anything else by re-running the
script that produced it — never hand-edit a report.

| File                        | Written by               | Contents                                                                                                                                                                                                              |
| --------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inventory.json`            | `pnpm content:inventory` | One record per old article pair found under the legacy corpus: category, slug, absolute source paths, size, heading and code-fence counts, word counts, CJK ratio. The basis for tier assignment and import planning. |
| `import.json`               | `pnpm content:import`    | Result of the staging import: which pairs were converted into staged topics, the target slug and track for each, plus per-pair skips and failures with reasons.                                                       |
| `lint/{id}.json`            | `pnpm content:lint`      | Per-topic lint findings, one file per topic id: rule id, severity, message, and location for every problem found in that topic's bilingual pair.                                                                      |
| `link-cache.json`           | `pnpm content:check`     | Cache of external link checks, keyed by URL: last status code, last checked timestamp, and redirect target. Lets repeat runs skip URLs verified recently.                                                             |
| `polish/state.json`         | `pnpm content:polish`    | Resumable queue state for the polish run: per-slug status (pending, in progress, done, failed), attempt count and last run timestamp. Committed on purpose.                                                           |
| `polish/{slug}/report.json` | `pnpm content:polish`    | Per-topic polish detail: the edits applied, the checks run afterwards, and any diagnostics emitted while polishing that slug.                                                                                         |
| `polish/run.log`            | `pnpm content:polish`    | Append-only human-readable log of the current polish run, for tailing while it works.                                                                                                                                 |
