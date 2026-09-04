// OG image generation. `ogPaths()` must stay in lockstep with the URLs `seo.ts` puts in the
// head, and `renderOg()` must produce a real PNG for both locales. The rendering tests need
// the build-time font binaries, so they skip (loudly) when `.cache/fonts` is empty and the
// download cannot run — an offline checkout still gets a green unit suite.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ensureFonts, ogPaths, parseLightPalette, renderOg } from '@/lib/og';
import { ogImageUrl } from '@/lib/seo';
import { SITE } from '@/data/site';

const fonts = await ensureFonts();
const canRender = fonts.some((f) => f.name === 'Plex');
if (!canRender) {
  console.warn(
    '[og] skipping the render tests: .cache/fonts holds no font binaries and they could not be ' +
      'downloaded (offline). Run `pnpm fonts` once with a network connection.',
  );
}

describe('ogPaths', () => {
  const paths = ogPaths();

  it('covers topics, track hubs and both home pages in both locales', () => {
    expect(paths).toContain('python/closures');
    expect(paths).toContain('zh/python/closures');
    expect(paths).toContain('python');
    expect(paths).toContain('zh/python');
    expect(paths).toContain('home');
    expect(paths).toContain('zh/home');
  });

  it('covers every localized generic page and glossary term', () => {
    for (const path of ['glossary', 'glossary/closure', 'tracks', 'search', 'settings', '404']) {
      expect(paths).toContain(path);
      expect(paths).toContain(`zh/${path}`);
    }
  });

  it('matches the URLs seo.ts advertises', () => {
    const url = (p: string) => `${SITE.url}/og/${p}.png`;
    expect(ogImageUrl('en', '/python/closures/')).toBe(url('python/closures'));
    expect(ogImageUrl('zh', '/zh/python/closures/')).toBe(url('zh/python/closures'));
    expect(ogImageUrl('en', '/python/')).toBe(url('python'));
    expect(ogImageUrl('zh', '/zh/')).toBe(url('zh/home'));
    for (const path of [
      ogImageUrl('en', '/python/closures/'),
      ogImageUrl('zh', '/zh/python/closures/'),
      ogImageUrl('en', '/python/'),
      ogImageUrl('zh', '/zh/'),
    ]) {
      expect(paths).toContain(path.slice(`${SITE.url}/og/`.length, -'.png'.length));
    }
  });

  it('emits no duplicates and no leading slashes', () => {
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.filter((p) => p.startsWith('/'))).toEqual([]);
  });
});

describe('parseLightPalette', () => {
  it('reads every OG color from the light :root tokens', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/styles/tokens.css'), 'utf8');
    expect(parseLightPalette(source)).toEqual({
      bg: '#f6f7f9',
      line: '#e2e5eb',
      ink: '#15181e',
      ink2: '#4b5160',
      ink3: '#676d7c',
      acc: '#3451d1',
      'acc-soft': '#e9ecfa',
    });
  });

  it('fails when a required OG token is absent', () => {
    expect(() => parseLightPalette(':root { --bg: white; }')).toThrow(/--line/);
  });
});

describe.skipIf(!canRender)('renderOg', () => {
  const isPng = (buf: Buffer) => buf.subarray(0, 4).toString('latin1') === '\x89PNG';

  it('renders an English card', async () => {
    const png = await renderOg({
      title: 'Closures',
      subtitle: 'Functions that carry their birthplace with them.',
      track: 'Python',
      glyph: 'py',
      locale: 'en',
    });
    expect(isPng(png)).toBe(true);
    expect(png.byteLength).toBeGreaterThan(10_000);
  }, 60_000);

  it('renders a Chinese card', async () => {
    const png = await renderOg({
      title: '闭包',
      subtitle: '闭包是把定义时所在的作用域一起带走的函数。',
      track: 'Python',
      glyph: 'py',
      locale: 'zh',
    });
    expect(isPng(png)).toBe(true);
    expect(png.byteLength).toBeGreaterThan(10_000);
  }, 60_000);

  // The two degraded paths a CI or offline build can land on. Injecting the faces keeps them
  // testable without deleting the font cache or unplugging the network.
  it('renders Chinese with Plex alone, warning once', async () => {
    const plexOnly = fonts.filter((f) => f.name === 'Plex');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const first = await renderOg(
        { title: '闭包', subtitle: '延迟绑定', locale: 'zh' },
        { fonts: plexOnly },
      );
      const second = await renderOg(
        { title: '装饰器', subtitle: '语法糖', locale: 'zh' },
        { fonts: plexOnly },
      );
      expect(isPng(first)).toBe(true);
      expect(isPng(second)).toBe(true);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toContain('no CJK face');
    } finally {
      warn.mockRestore();
    }
  }, 60_000);

  it('falls back to a placeholder when there is no face at all', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const png = await renderOg(
        { title: 'Closures', subtitle: 'No fonts here', locale: 'en' },
        { fonts: [] },
      );
      expect(isPng(png)).toBe(true);
      // The placeholder carries no glyphs, so it is far smaller than a typeset card.
      expect(png.byteLength).toBeLessThan(10_000);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toContain('no text face');
    } finally {
      warn.mockRestore();
    }
  }, 60_000);

  it('renders long titles without throwing', async () => {
    const png = await renderOg({
      title: 'Architecture and system design, distributed systems and observability in practice',
      subtitle: 'A very long subtitle that has to be clamped to two lines before it runs off the card.',
      track: 'Architecture and system design',
      glyph: 'arch',
      locale: 'en',
    });
    expect(isPng(png)).toBe(true);
  }, 60_000);
});
