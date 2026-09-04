import {
  buildLlmsFull,
  buildLlmsIndex,
  buildLlmsTrack,
  cheatsheetMdUrl,
  mdUrl,
  type LlmsCheatsheet,
  type LlmsTopic,
} from '@/lib/llms';
import { getTrack } from '@/data/tracks';

const closuresEn: LlmsTopic = {
  track: 'python',
  slug: 'closures',
  lang: 'en',
  title: 'Closures',
  description: 'Functions that carry their birthplace with them.',
};

const closuresZh: LlmsTopic = {
  track: 'python',
  slug: 'closures',
  lang: 'zh',
  title: '闭包',
  description: '把定义时所在的作用域一起带走的函数。',
};

const eventLoopEn: LlmsTopic = {
  track: 'javascript',
  slug: 'event-loop',
  lang: 'en',
  title: 'The event loop',
  description: 'How JavaScript decides what runs next.',
};

const pythonSheet: LlmsCheatsheet = {
  slug: 'python',
  lang: 'en',
  title: 'Python cheatsheet',
  description: 'Python on one page.',
};

describe('mdUrl', () => {
  it('points at the Markdown twin of a topic, per locale', () => {
    expect(mdUrl('python', 'closures', 'en')).toBe('https://codewiki.com/python/closures.md');
    expect(mdUrl('python', 'closures', 'zh')).toBe('https://codewiki.com/zh/python/closures.md');
  });
});

describe('cheatsheetMdUrl', () => {
  it('points at the localized Markdown twin', () => {
    expect(cheatsheetMdUrl('python', 'en')).toBe('https://codewiki.com/cheatsheets/python.md');
    expect(cheatsheetMdUrl('python', 'zh')).toBe('https://codewiki.com/zh/cheatsheets/python.md');
  });
});

describe('buildLlmsIndex', () => {
  const index = buildLlmsIndex([closuresEn, eventLoopEn, closuresZh], 7, 1, [pythonSheet]);

  it('opens with the site name and a blockquote summary', () => {
    const lines = index.split('\n');
    expect(lines[0]).toBe('# codewiki');
    expect(index).toMatch(/\n> \S/);
  });

  it('lists every English topic as a link to its Markdown twin', () => {
    expect(index).toContain(
      '- [Closures](https://codewiki.com/python/closures.md): Functions that carry their birthplace with them.',
    );
    expect(index).toContain(
      '- [The event loop](https://codewiki.com/javascript/event-loop.md): How JavaScript decides what runs next.',
    );
  });

  it('groups topics by track, in registry order, under the Tracks heading', () => {
    const tracks = index.indexOf('## Tracks');
    const python = index.indexOf('### Python');
    const javascript = index.indexOf('### JavaScript');
    expect(tracks).toBeGreaterThan(-1);
    // Python comes before JavaScript in TRACKS, so it comes first here too.
    expect(python).toBeGreaterThan(tracks);
    expect(javascript).toBeGreaterThan(python);
  });

  it('mirrors the Chinese topics under their own heading, with /zh/ links', () => {
    const chinese = index.indexOf('## Chinese');
    expect(chinese).toBeGreaterThan(index.indexOf('## Tracks'));
    expect(index.indexOf('](https://codewiki.com/zh/python/closures.md)')).toBeGreaterThan(chinese);
    // The English twin is never listed under Chinese.
    expect(index.slice(chinese)).not.toContain('https://codewiki.com/python/closures.md');
  });

  it('leaves out tracks that have nothing written yet', () => {
    expect(index).not.toContain('### Rust');
  });

  it('lists public cheatsheets with their Markdown twins', () => {
    expect(index).toContain('## Cheatsheets');
    expect(index).toContain(
      '- [Python cheatsheet](https://codewiki.com/cheatsheets/python.md): Python on one page.',
    );
  });

  it('ends with the optional resources, counted', () => {
    const optional = index.slice(index.indexOf('## Optional'));
    expect(optional).toContain('https://codewiki.com/api/glossary.json');
    expect(optional).toContain('https://codewiki.com/api/paths.json');
    expect(optional).toContain('https://codewiki.com/llms-full.txt');
    expect(optional).toContain('7');
    expect(optional).toContain('1');
  });

  it('ends with exactly one newline', () => {
    expect(index.endsWith('\n')).toBe(true);
    expect(index.endsWith('\n\n')).toBe(false);
  });
});

describe('buildLlmsTrack', () => {
  const python = getTrack('python')!;
  const page = buildLlmsTrack(python, [closuresEn, closuresZh, eventLoopEn]);

  it('names the track and keeps only its own topics', () => {
    expect(page.split('\n')[0]).toBe('# codewiki: Python');
    expect(page).toContain('https://codewiki.com/python/closures.md');
    expect(page).not.toContain('event-loop');
  });

  it('mirrors the Chinese twins', () => {
    expect(page).toContain('## Chinese');
    expect(page).toContain('https://codewiki.com/zh/python/closures.md');
  });
});

describe('buildLlmsFull', () => {
  const full = buildLlmsFull([
    { title: 'Closures', source: 'https://codewiki.com/python/closures.md', body: 'First body.' },
    { title: '闭包', source: 'https://codewiki.com/zh/python/closures.md', body: 'Second body.' },
  ]);

  it('writes one titled, sourced section per entry', () => {
    expect(full).toContain('# Closures\n\nSource: https://codewiki.com/python/closures.md\n\nFirst body.');
  });

  it('separates the sections with a horizontal rule', () => {
    expect(full).toContain('First body.\n\n---\n\n# 闭包');
  });

  it('is empty when there is nothing to concatenate', () => {
    expect(buildLlmsFull([])).toBe('');
  });
});
