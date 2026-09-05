import { describe, expect, it } from 'vitest';

import { SITE } from '@/data/site';
import { reportUrl } from '@/lib/report';

/** "Report an error" — ROADMAP A4: one prefilled issue per page that carries a claim about code. */
describe('reportUrl', () => {
  it('opens a new issue in the repository the site declares', () => {
    const url = new URL(reportUrl({ path: '/python/closures/' }));
    expect(`${url.origin}${url.pathname}`).toBe(`${SITE.repo}/issues/new`);
    expect(url.searchParams.get('labels')).toBe('content');
  });

  it('names the page in the title and the canonical URL in the body', () => {
    const url = new URL(reportUrl({ path: '/zh/python/closures/' }));
    expect(url.searchParams.get('title')).toBe('Error on /zh/python/closures/');
    expect(url.searchParams.get('body')).toContain(`Page: ${SITE.url}/zh/python/closures/`);
  });

  it('carries the section when the page knows it, and asks for it when it does not', () => {
    expect(new URL(reportUrl({ path: '/p/', section: 'Late binding' })).searchParams.get('body')).toContain(
      'Where: Late binding',
    );
    expect(new URL(reportUrl({ path: '/p/' })).searchParams.get('body')).toContain('Where: (section');
  });

  it('escapes everything it puts in the query string', () => {
    const raw = reportUrl({ path: '/p/', section: 'a & b?c=d #e' });
    expect(raw).not.toMatch(/[?].*[?]/);
    expect(new URL(raw).searchParams.get('body')).toContain('Where: a & b?c=d #e');
  });
});
