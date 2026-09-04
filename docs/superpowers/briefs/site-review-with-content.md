# Whole-site review with real content — brief for an Opus reviewer

Context: `main` now carries the complete site (P1 + P2) and, once the content branch merges, ~290 reviewed bilingual topics, 6 learning paths with checkpoint banks, 12 cheatsheets, 22 interview banks, 115+ glossary terms and review katas. Nothing has been deployed yet. This review is the last gate before deployment.

Work read-only in the given worktree (do not edit files or commit); build the site (`pnpm build`) and serve `dist` (`pnpm preview`, or a static server on another port if 4321 is busy); use Playwright for browser checks.

## Part 1 — content sampling (accuracy and standard)

Pick 10 topics at random across at least 8 tracks (use `ls src/content/topics/*/*.en.mdx | shuf -n 10`) plus `python/closures` and one `ai-era` topic. For each, read both languages and judge against `prompts/editorial-standard.md`: technical accuracy for the pinned version (run the examples yourself when a runtime exists — `python3.14` is at `~/.local/bin/python3.14`, Node 24, Go, Rust, GCC are installed), whether pitfalls are real and specific, whether the "In the AI era" block names real generated-code failure modes, translation fidelity (same meaning, natural Chinese, identifiers untouched), and any raw `<`/`>` or MDX hazards. Score each 1–5 with one line of evidence; list every factual error you can prove.

## Part 2 — site behaviour with real data

On the built site, check with real content: home and track hubs (counts, recommended path cards, "also in this track" links now live), a topic page in each depth mode and in bilingual mode, the path map for `python-from-zero` and `cs-foundations` with live nodes, `/practice/` with hundreds of items (filters, kata of the day, performance of the page), a kata page of type `review`, the interview bank pages (FAQPage JSON-LD size, page weight), flashcards after finishing a topic, cheatsheets in print emulation, the playground with an SQL example that uses a seed, the prompt builder with a real topic, `/rules/python/CLAUDE.md` and `/packs/python/functions-deeper.md`, `llms.txt` and `llms-full.txt` size, search results (Pagefind index size and query latency for "closure" and "闭包"), sitemap and OG images for a sample of new routes, both locales. Report page weights, Lighthouse scores for 8 representative URLs (`pnpm exec lhci autorun` with the repository config, plus one interview bank and one path page), and every console error.

## Part 3 — verdict

`Ready to deploy` or `Not ready — <list>` with Critical/Important/Minor findings (`file:line` or URL, failure scenario, smallest fix). Write the report to the path you were given and end with `TASK DONE`.
