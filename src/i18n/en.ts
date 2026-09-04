// English UI strings. Keys are dot-namespaced by surface; `{var}` marks an interpolation slot.
// Every key added here must also be added to `zh.ts` (enforced by its `satisfies` type and a unit test).

export default {
  'site.tagline': 'Programming, explained precisely.',

  'nav.tracks': 'Tracks',
  'nav.paths': 'Paths',
  'nav.practice': 'Practice',
  'nav.cheatsheets': 'Cheatsheets',
  'nav.compare': 'Compare',
  'nav.playground': 'Playground',
  'nav.aiEra': 'AI era',
  'nav.search': 'Search',
  'nav.searchHint': '⌘K',
  'nav.primary': 'Main navigation',
  'nav.menu': 'Menu',

  'a11y.skip': 'Skip to content',

  'theme.system': 'System',
  'theme.light': 'Light',
  'theme.dark': 'Dark',

  'home.eyebrow': 'programming, explained precisely · en / zh',
  'home.h1': 'Master code in the AI era.',
  'home.sub':
    'A reference and a course in one place. Every topic answers in the first screen, runs in the browser, and can be handed to your AI as clean Markdown.',
  'home.startPath': 'Start a path',
  'home.browseTracks': 'Browse tracks',
  'home.verified': 'Currently verified against',
  'home.tracks': 'Tracks',
  'home.allTracks': 'All tracks',

  // The static command-palette panel in the hero. Arrows and slashes are template chrome.
  'home.palette.query': 'closure',
  'home.palette.move': 'move',
  'home.palette.open': 'open',
  'home.palette.playground': 'open in playground',
  'home.palette.offline': 'Search runs offline',

  'home.feature.1.title': 'Runs in the browser',
  'home.feature.1.desc':
    'JavaScript, TypeScript, Python and SQL execute inline. Edit the example, press Run, see the output. Nothing leaves your machine.',
  'home.feature.2.title': 'Depth dial',
  'home.feature.2.desc':
    'Quick shows the TL;DR and one example. Standard adds mechanics and pitfalls. Deep adds internals and edge cases.',
  'home.feature.3.title': 'One article, two languages',
  'home.feature.3.desc':
    'English and Chinese are the same text, paragraph for paragraph. Read them side by side and learn the terminology as you go.',
  'home.feature.4.title': 'Practice that sticks',
  'home.feature.4.desc':
    'Predict-the-output, spot-the-bug, checkpoint quizzes and spaced-repetition flashcards built from what you read.',
  'home.feature.5.title': 'Made for your AI too',
  'home.feature.5.desc':
    'Every page has a Markdown twin and an llms.txt index. One click opens Claude or ChatGPT with the right section and a prompt that teaches.',
  'home.feature.6.title': 'Dated and versioned',
  'home.feature.6.desc':
    'Each topic states the language version it was checked against and when. Stale pages are flagged, not hidden.',

  'home.mode.learn.label': 'Learn',
  'home.mode.learn.title': 'Paths with a map',
  'home.mode.learn.desc':
    'Ordered topics with prerequisites drawn as a graph and a checkpoint at each milestone. Progress is stored in your browser and can be exported.',
  'home.mode.lookup.label': 'Look up',
  'home.mode.lookup.title': 'Answer on the first screen',
  'home.mode.lookup.desc':
    'TL;DR cards, printable cheatsheets, a bilingual glossary with hover definitions, and the same task written in five languages side by side.',
  'home.mode.practice.label': 'Practice',
  'home.mode.practice.title': 'Small, daily, measurable',
  'home.mode.practice.desc':
    'Predict-the-output puzzles, spot-the-bug katas with tests, interview banks per track, and flashcards that come back when you are about to forget.',

  'home.bilingual.label': 'bilingual mode',
  'home.bilingual.title': 'Paragraph-aligned English and Chinese',

  'home.ai.label': 'ask your ai',
  'home.ai.title': 'Prompts that carry the page with them',
  'home.prompt.1': 'Explain this section as if I only know loops',
  'home.prompt.2': 'Give me three bugs to find in this example',
  'home.prompt.3': 'Quiz me on this page until I get five right',
  'home.promptMeta': 'Claude · ChatGPT · Copy',

  'home.continue': 'continue',
  'home.kata': 'kata today',
  'home.recall': 'recall',
  'home.review': 'Review',
  'home.due': '{count} flashcards due',
  'home.progress': 'Reading progress: {title}',

  'footer.tagline': 'codewiki · static site · progress stays in your browser',
  'footer.about': 'About',
  'footer.contribute': 'Contribute',
  'footer.llms': 'llms.txt',
  'footer.rss': 'RSS',
  // Always names the *other* language, in that language.
  'footer.otherLocale': '中文',

  'topic.level': 'level',
  'topic.time': 'time',
  'topic.checked': 'checked',
  'topic.status': 'status',
  'topic.reviewed': 'Reviewed',
  'topic.readTime': '{min} min at Standard depth',

  'depth.quick': 'Quick',
  'depth.standard': 'Standard',
  'depth.deep': 'Deep',
  'depth.switchDeep': 'Switch to Deep',

  'bilingual.label': 'bilingual',
  'bilingual.off': 'off',
  'bilingual.on': 'EN + 中文',

  'toc.title': 'on this page',
  'toc.deep': 'deep',

  'topic.before': 'before this',
  'topic.next': 'next up',
  'topic.askAi': 'Ask your AI about this page',
  'topic.copyMd': 'Copy as Markdown',
  'topic.addFlash': 'Add to flashcards',
  'topic.edit': 'Edit on GitHub',
  'topic.clear': 'Was this clear?',
  'topic.yes': 'yes',
  'topic.notQuite': 'not quite',
  'topic.terms': 'terms on this page',
  'topic.path': 'your path',
  'topic.milestone': 'milestone {done} of {total} · {left} topics left',

  // Labels the markdown pipeline emits in English and `Base.astro` swaps per locale.
  'callout.pitfall': 'Pitfall',
  'callout.note': 'Note',
  'callout.tip': 'Tip',
  'callout.warning': 'Warning',
  'callout.ai': 'AI tip',

  'checkpoint.soon': 'Checkpoint available in Practice',

  'code.copy': 'Copy',
  'code.copied': 'Copied',
  'code.copyFailed': 'Copy failed',
  'code.run': 'Run',
  'code.running': 'Running…',
  'code.reset': 'Reset',
  'code.output': 'Output',
  'code.loadingPython': 'Loading Python…',

  'tracks.title': 'Tracks',
  'tracks.sub': 'Every track on codewiki: eleven languages, nine domains and two pillars.',
  'tracks.languages': 'Languages',
  'tracks.domains': 'Domains',
  'tracks.pillars': 'Pillars',

  'track.topics': '{count} topics',
  // English needs the singular; Chinese does not, so its value is the same either way.
  'track.topicsOne': '{count} topic',
  'track.sections': '{count} sections',
  'track.verified': 'verified {version}',
  'track.path': 'recommended path',
  'track.continue': 'Continue',
  'track.map': 'See the whole map',
  'track.progress': 'your progress',
  'track.export': 'Export',
  'track.import': 'Import',
  'track.range': '{from} → {to}',
  // Reads as a Chinese label on the English page and an English one on the Chinese page: it states
  // that the *other* language is complete for this track.
  'track.otherComplete': '中文完整',
  'track.cheatsheet': 'Cheatsheet',
  'track.interview': 'Interview bank',
  'track.compare': 'Compare',
  'track.playground': 'Playground',
  'track.soon': 'soon',
  'track.comingSoon': 'coming soon',
  'track.pathMeta': '{topics} topics · {checkpoints} checkpoints · about {hours} h',
  'track.continueTopic': 'Continue: {title}',
  'track.done': '{done} of {total} done',
  'track.milestone': 'milestone {done} of {total}',
  'track.readPct': '{pct}% read',
  'track.minutes': '{min} min',
  'track.topicsRead': 'topics read',
  'track.recent': 'recently reviewed',
  'track.askAi': 'ask your ai',
  'track.aiPrompt': 'Build me a two-week plan for the unread {track} topics, 30 minutes a day.',
  'track.also': 'also in this track',
  'track.alsoCheatsheet': '{track} cheatsheet',
  'track.alsoCompare': '{track} compared with other languages',
  'track.alsoInterview': 'Interview bank: {track}',
  'track.alsoGlossary': 'Glossary: {track} terms',
  'track.show': 'show',
  'track.filterAll': 'All',
  'track.filterUnread': 'Unread',
  'track.filterRead': 'Read',

  'difficulty.beginner': 'beginner',
  'difficulty.intermediate': 'intermediate',
  'difficulty.advanced': 'advanced',

  'glossary.title': 'Glossary',
  'glossary.terms': 'Terms',

  'search.title': 'Search',
  'search.placeholder': 'Search topics, terms and practice',
  'search.empty': 'Nothing matches yet. Try a shorter word.',
  'search.topics': 'Topics',
  'search.glossary': 'Glossary',
  'search.paths': 'Paths',
  'search.practice': 'Practice',

  'settings.theme': 'Theme',
  'settings.depth': 'Default depth',
  'settings.bilingual': 'Bilingual mode',
  'settings.fontSize': 'Font size',
  'settings.data': 'Your data',
  'settings.export': 'Export progress',
  'settings.import': 'Import progress',
  'settings.clear': 'Clear all data',
  'settings.confirmClear':
    'This deletes your progress, flashcards and settings from this browser. There is no undo.',

  'notFound.title': 'This page does not exist',
  'notFound.body': 'The link may be old, or the topic may not be written yet. Search, or start from a track.',
  'notFound.home': 'Go to the home page',

  'ai.explain': 'Explain it simpler',
  'ai.quiz': 'Quiz me',
  'ai.bugs': 'Find the bugs',
  'ai.compare': 'Compare with another language',
  'ai.apply': 'Apply it to my code',
  'ai.openClaude': 'Open in Claude',
  'ai.openChatGPT': 'Open in ChatGPT',
  'ai.copy': 'Copy prompt',
} as const;
