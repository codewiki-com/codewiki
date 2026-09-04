// OG image generation. `ogPaths()` must stay in lockstep with the URLs `seo.ts` puts in the
// head, and `renderOg()` must produce a real PNG for both locales. The rendering tests need
// the build-time font binaries, so they skip (loudly) when `.cache/fonts` is empty and the
// download cannot run — an offline checkout still gets a green unit suite.
import { ensureFonts, ogPaths, renderOg } from '@/lib/og';
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

  it('covers topics, tracks and both home pages in both locales', () => {
    expect(paths).toContain('python/closures');
    expect(paths).toContain('zh/python/closures');
    expect(paths).toContain('python');
    expect(paths).toContain('zh/python');
    expect(paths).toContain('home');
    expect(paths).toContain('zh/home');
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
