/**
 * Technical identifiers that stay in English on a Chinese page.
 *
 * `prompts/editorial-standard.md` §3 requires a library, framework, protocol or keyword to keep
 * its own name: a reader looking for `asyncio` in the docs will not find 「异步IO」. Most such
 * names are recognisable by shape — a digit, a dot, a `+`, a `#`, or a capital inside the word —
 * and `localization.spec.ts` accepts those without a list. This file is for the rest: names that
 * are ordinary lower-case or capitalised words and would otherwise read as untranslated UI text.
 *
 * Keep it to proper names. A word here is a word the localization gate can no longer catch.
 */
export const IDENTIFIERS: readonly string[] = [
  'asyncio',
  // Product names that carry a space and would otherwise read as untranslated UI text.
  'Claude API',
  'Claude Code',
  'Django',
  'Flask',
  'Docker',
  'Kubernetes',
  'Redis',
  'Postgres',
  'PostgreSQL',
  'Rust',
  'Swift',
  'Kotlin',
  'Java',
  'Node',
  'Deno',
  'Bun',
  'React',
  'Vue',
  'Svelte',
  'Angular',
  'Astro',
  'Vite',
  'Webpack',
  'Terraform',
  'Ansible',
  'Prometheus',
  'Grafana',
  'Nginx',
  'Unity',
  'Godot',
  'Pandas',
  'NumPy',
  'PyTorch',
  'Kafka',
  'Celery',
  'Cursor',
  'Copilot',
  'Claude',
  'ChatGPT',
  'Gemini',
  'Codex',
  'Git',
  'GitHub',
];
