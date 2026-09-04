import { localeFromPath, localizePath, alternates, topicUrl, trackUrl, stripLocale } from '@/lib/urls';

describe('urls', () => {
  it('detects locale', () => {
    expect(localeFromPath('/zh/python/')).toBe('zh');
    expect(localeFromPath('/python/')).toBe('en');
    expect(localeFromPath('/zh/')).toBe('zh');
  });
  it('strips and adds prefixes', () => {
    expect(stripLocale('/zh/python/closures/')).toBe('/python/closures/');
    expect(localizePath('/python/closures/', 'zh')).toBe('/zh/python/closures/');
    expect(localizePath('/zh/python/', 'en')).toBe('/python/');
    expect(localizePath('/', 'zh')).toBe('/zh/');
  });
  it('builds alternates', () => {
    expect(alternates('/zh/python/')).toEqual({ en: '/python/', zh: '/zh/python/' });
  });
  it('builds content urls', () => {
    expect(topicUrl('python', 'closures', 'zh')).toBe('/zh/python/closures/');
    expect(trackUrl('python', 'en')).toBe('/python/');
  });
});
