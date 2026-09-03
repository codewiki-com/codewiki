import { TRACKS, getTrack, getSection, HOME_TRACKS } from '@/data/tracks';
import { SITE } from '@/data/site';

describe('tracks', () => {
  it('has 22 unique tracks with sections', () => {
    expect(TRACKS).toHaveLength(22);
    expect(new Set(TRACKS.map((t) => t.slug)).size).toBe(22);
    for (const t of TRACKS) {
      expect(t.sections.length).toBeGreaterThanOrEqual(4);
      expect(t.name.zh).not.toEqual(t.name.en);
    }
  });
  it('section slugs are unique within a track and kebab-case', () => {
    for (const t of TRACKS) {
      const s = t.sections.map((x) => x.slug);
      expect(new Set(s).size).toBe(s.length);
      for (const x of s) expect(x).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
  it('home list references real tracks', () => {
    for (const s of HOME_TRACKS) expect(getTrack(s)).toBeDefined();
    expect(HOME_TRACKS).toHaveLength(12);
  });

  it('track slugs are kebab-case and glyphs are unique', () => {
    for (const t of TRACKS) expect(t.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(new Set(TRACKS.map((t) => t.glyph)).size).toBe(22);
  });
  it('covers 11 languages, 9 domains and 2 pillars', () => {
    const count = (kind: string) => TRACKS.filter((t) => t.kind === kind).length;
    expect(count('language')).toBe(11);
    expect(count('domain')).toBe(9);
    expect(count('pillar')).toBe(2);
  });
  it('names and descriptions are filled in both locales', () => {
    for (const t of TRACKS) {
      for (const value of [t.name.en, t.name.zh, t.description.en, t.description.zh])
        expect(value.trim().length).toBeGreaterThan(0);
      for (const s of t.sections) {
        expect(s.name.en.trim().length).toBeGreaterThan(0);
        expect(s.name.zh.trim().length).toBeGreaterThan(0);
      }
    }
  });
  it('looks up tracks and sections', () => {
    expect(getTrack('python')?.glyph).toBe('py');
    expect(getTrack('nope')).toBeUndefined();
    expect(getSection('python', 'stdlib')?.name.en).toBe('Standard library');
    expect(getSection(getTrack('rust')!, 'ownership-borrowing')).toBeDefined();
    expect(getSection('python', 'nope')).toBeUndefined();
  });
});

describe('site', () => {
  it('carries the site constants', () => {
    expect(SITE.name).toBe('codewiki');
    expect(SITE.url).toBe('https://codewiki.com');
    expect(SITE.url.endsWith('/')).toBe(false);
    expect(SITE.tagline.zh).not.toEqual(SITE.tagline.en);
    expect(SITE.repo).toMatch(/^https:\/\/github\.com\//);
  });
});
