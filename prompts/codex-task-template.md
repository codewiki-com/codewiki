# Codex implementation brief — template

Copy this file next to the task brief (for plan tasks: `<workspace>/task-N-codex.md`), fill the
placeholders, and run it with `scripts/dev/codex-task.sh <worktree> <brief> <log>`. Keep the brief
under 120 lines: Codex reads the plan's task brief for the requirements; this wrapper only adds what
the task brief cannot know.

---

# {{TASK TITLE}} — codewiki ({{one-line project description}})

You are implementing one task of the {{plan name}} plan. You are inside the git worktree for branch `{{branch}}` (cut from `{{base commit}}`, dependencies installed). Work only here; commit; do not push. Do not edit `docs/superpowers/STATUS.md`.

## Read first

1. `{{path to task-N-brief.md}}` — the requirements, with the exact values to use verbatim. It is the single source of truth for this task.
2. {{one to four files that define the interfaces this task builds on, with one clause each on why}}

## Context the brief cannot know

- {{interfaces and decisions from earlier tasks: exact names, signatures, file paths}}
- {{controller rulings on ambiguities in the brief}}
- {{pointers to deferred findings in the ledger that touch this area}}

## Constraints

- Static Astro output, `trailingSlash: 'always'`, English at `/`, Chinese at `/zh/`; every visible string through `t(locale, key)` with the English value in `src/i18n/en.ts` and the same English text as a placeholder in `src/i18n/zh.ts` (comment `//P2` above it).
- Tokens only for colours (`src/styles/tokens.css`); IBM Plex; the mockups under `docs/design/mockups/` are the visual truth.
- User state only through `src/lib/prefs.ts`; islands hydrate lazily; topic pages keep their script budget.
- All comments, docs and commit messages in English; conventional commits made with `git -c user.name="codewiki" -c user.email="tomchen.org@gmail.com" commit`.
- Before committing: `pnpm lint && pnpm check && pnpm test && pnpm build && pnpm check:links` plus the e2e specs the brief names (`ss -ltnp | grep ':4321 '` first; if another process holds the port, stop and report its pid and cwd instead of killing it).

## Deliverables

- The commits the brief names.
- Report at `{{path to task-N-report.md}}`: what changed per step, exact commands and their key numbers, screenshots if the brief asks for them (under `/tmp/claude-1000/-home-chen-githubprojects-codewiki-codewiki/8272f336-6e2f-4c18-825a-c4b7b09b2b7f/scratchpad/shots-{{task}}/`), anything unverified or deviating from the brief and why.
- Print `TASK DONE` as the last line of your output, or `TASK FAILED: <reason>` if you stopped early.
