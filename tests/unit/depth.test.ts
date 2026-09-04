import { describe, it, expect } from 'vitest';
import { readDepth, filterHeadings } from '@/lib/depth';

describe('depth', () => {
  const storage = {
    getItem: (k: string) => (k === 'cw:v1:prefs' ? JSON.stringify({ depth: 'deep' }) : null),
    setItem: () => {},
  };

  it('url overrides prefs, prefs override default', () => {
    expect(readDepth(storage, '?depth=quick')).toBe('quick');
    expect(readDepth(storage, '')).toBe('deep');
    expect(readDepth({ getItem: () => null, setItem: () => {} }, '')).toBe('standard');
  });

  it('filters headings by mode', () => {
    const hs = [
      { slug: 'a', text: 'A', depth: 2, level: 'standard' as const },
      { slug: 'b', text: 'B', depth: 2, level: 'deep' as const },
    ];
    expect(filterHeadings(hs, 'standard').map((h) => h.slug)).toEqual(['a', 'b']);
    expect(filterHeadings(hs, 'standard')[1]).toMatchObject({ dimmed: true });
    expect(filterHeadings(hs, 'quick')).toHaveLength(0);
  });

  it('shows every heading undimmed at Deep', () => {
    const hs = [
      { slug: 'a', text: 'A', depth: 2, level: 'standard' as const },
      { slug: 'b', text: 'B', depth: 3, level: 'deep' as const },
    ];
    expect(filterHeadings(hs, 'deep').map((h) => h.dimmed)).toEqual([false, false]);
  });

  it('treats an unreadable store and a bad depth as Standard', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {},
    };
    expect(readDepth(broken, '')).toBe('standard');
    expect(readDepth({ getItem: () => '{"depth":"skim"}', setItem: () => {} }, '?depth=all')).toBe(
      'standard',
    );
  });
});
