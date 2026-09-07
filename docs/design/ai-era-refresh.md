# Optional, useful AI collaboration sections

Approved direction: user conversation, 2026-09-07. The user explicitly permits substantial rewriting or deletion and asks that the work respect present and future model capabilities. GPT models replace the previous Claude implementation assignments for this work.

## Editorial decision

An article earns an AI collaboration section only when it offers a concrete use of the topic that the rest of the article does not already teach. No article needs an AI-labelled section merely to fit a template. Retain the existing localized H2 where a section survives; remove the entire H2 where it does not.

Remove unsupported statements about what models often get wrong, generic review requests, repeated terminology lists, and instructions that merely ask an agent to know the topic. Do not substitute blanket optimism, model rankings, or assertions that only people can make judgments. Model-specific empirical claims require evidence and dates; this edit does not introduce them.

Useful retained material might describe using repository context to compare migration approaches, exploring a design through executable alternatives, or supplying a project-specific compatibility requirement for an agent to implement. Focus on the outcome, relevant context and actual tradeoffs. Do not prescribe ceremonial checkpoints for routine work. Stronger agents should make the advice more useful, not obsolete it.

Read the existing section before deciding. Technical lessons already covered in the main article or pitfalls need no replacement. Move a uniquely useful lesson into the relevant existing prose only when deleting it would lose substance. Do not relocate the old checklist wholesale. Sections in the AI-era track itself are especially likely to repeat the entire article.

There is no deletion percentage, replacement length quota, or mandatory subsection list. Concision is welcome. Keep English and Chinese aligned in meaning and block structure. Preserve executable examples, recorded outputs, source links and MDX depth boundaries.

## Implementation boundaries

- Review all 287 live bilingual topic pairs, with English-first decisions and aligned Chinese edits.
- Make the content checker accept absent AI sections and remove the artificial incentive to pad an otherwise complete article back to 400 lines.
- Update active topic-writing prompts so later content waves do not recreate the old template.
- Keep rules export useful through existing pitfalls; retain harmless support for older checklist syntax without forcing new checklists.
- Adjust browser assertions that depend on a removed article heading.
- Do not rewrite staged legacy content, other roadmap features, model configuration, or unrelated learning exercises.
- Do not deploy or publish.

## Execution and acceptance

1. Pilot five different topics; review actual bilingual diffs before expanding.
2. Assign nonoverlapping track groups to Sol high editors. Record a decision for every pair. The coordinator reviews retained prose and representative deletions.
3. Check that edited pairs remain structurally aligned, compile as MDX, preserve code fences and depth wrappers, and contain no old four-part boilerplate.
4. Run relevant content checks, lint, type checks, unit tests, build, internal-link checks, browser tests and the existing performance gate. Investigate failures before claiming readiness.
5. Record actual counts, examples and validation results in a ledger and update STATUS/ROADMAP to supersede the old B3 scope.

Temporary extraction and per-editor decision files live outside the repository. Durable decisions and verification results belong in the ledger, not hundreds of generated process files.
