import { readFileSync } from 'node:fs';

import { LEGACY_REDIRECTS, parseRedirectsFile, renderRedirectsFile } from '@/data/redirects';

const read = (file: string) => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

describe('legacy redirects', () => {
  it('sends every retired duplicate to its survivor, in both locales', () => {
    expect(LEGACY_REDIRECTS).toEqual({
      '/python/scope/': '/python/scope-namespaces/',
      '/zh/python/scope/': '/zh/python/scope-namespaces/',
      '/python/fastapi/': '/backend/fastapi/',
      '/zh/python/fastapi/': '/zh/backend/fastapi/',
      '/python/django/': '/backend/django/',
      '/zh/python/django/': '/zh/backend/django/',
    });
  });

  it('keeps public/_redirects and the Astro config in step', () => {
    expect(parseRedirectsFile(read('public/_redirects'))).toEqual({ ...LEGACY_REDIRECTS });
    expect(read('public/_redirects')).toBe(renderRedirectsFile());
    expect(read('astro.config.mjs')).toContain('redirects: { ...LEGACY_REDIRECTS }');
  });

  it('keeps every path site-absolute and slash-terminated so both hosts agree', () => {
    for (const [from, to] of Object.entries(LEGACY_REDIRECTS)) {
      expect(from).toMatch(/^\/(?:zh\/)?[a-z0-9-]+\/[a-z0-9-]+\/$/);
      expect(to).toMatch(/^\/(?:zh\/)?[a-z0-9-]+\/[a-z0-9-]+\/$/);
      expect(Object.hasOwn(LEGACY_REDIRECTS, to)).toBe(false);
    }
  });
});
