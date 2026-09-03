# Draft brief: map the legacy taxonomy onto tracks and sections

You are sorting a bilingual article corpus into a new taxonomy. The corpus has 20 top-level directories ("old categories") and a few hundred free-text subcategory strings written by many hands over several years. The new taxonomy is a fixed list of tracks, each with a fixed, ordered list of sections. Your job is to decide, for every old subcategory, which `{track, section}` its articles belong to.

Work from the data in this brief only. Do not read the corpus, do not invent tracks or sections, and do not change the target taxonomy.

## The target taxonomy

Each line is a track slug followed by its sections as `section-slug (English name)`. These slugs are the only legal values: a `track` must be one of the track slugs, and its `section` must be one of that track's own section slugs.

{{TAXONOMY}}

There is one extra section value, `unsorted`, which the pipeline assigns by itself to anything you do not map. Never write `unsorted` yourself.

## What to map

{{STATS}}

### Old subcategories

Each line is `old-category::old-subcategory` — the number of article pairs filed under it — up to three sample titles. The key on the left is verbatim: copy it into your JSON exactly as printed, including case, spacing and Chinese characters.

{{SUBCATEGORIES}}

### Article pairs with no subcategory at all

These pairs carry no subcategory on either side, so no subcategory rule can reach them. Map the ones whose title clearly belongs in a specific section through `overrides`, keyed by the article id; leave the genuinely generic ones alone and the pipeline will file them as `unsorted` for a human to sort.

{{NO_SUBCATEGORY}}

## Rules

1. Map **every** `old-category::old-subcategory` key listed above to a `{track, section}` in `subcategories`. No key may be left out.
2. Choose the **most specific** section that honestly fits. Prefer a real topical section over a track's catch-all "basics" section whenever the subcategory name and sample titles support it.
3. The old category usually names the right track, but not always: a subcategory under `devops` may really belong to `backend`, one under `datascience` may belong to `ai`, and language-agnostic material (algorithms, data structures, networking, operating systems, Git and the shell, text and numbers) belongs in the `foundations` track. Cross-track material about working with AI tools belongs in `ai-era`. Follow the content, not the directory.
4. Use `overrides` for **individual articles** whose title clearly belongs somewhere other than where their subcategory rule would send them. Key them by article id (`old-category/slug`). Use this sparingly — it is for the exceptions, not for bulk work.
5. Use `drop` for **individual articles** whose title shows they are off-topic for every track in the taxonomy, keyed by article id, with a one-line reason as the value. Do not drop something merely because it is hard to place; if it fits any section, map it.
6. Keep the four entries already present in `drop` below, unchanged, and add yours alongside them.

{{EXISTING_DROP}}

## Output

Write your answer to `scripts/content/mapping.draft.json` as a JSON object with exactly these three keys:

- `subcategories` — every key from the list above, each mapped to `{ "track": "...", "section": "..." }`
- `overrides` — article id → `{ "track": "...", "section": "..." }` (may be empty)
- `drop` — article id → one-line reason (contains at least the four entries above)

Then print the same complete JSON to stdout as a single fenced ```json block. Print nothing after that block: no summary, no commentary, no closing remarks.
