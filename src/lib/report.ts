/**
 * "Report an error" — ROADMAP A4.
 *
 * Every page that carries a claim about code (a topic, a kata, an interview bank) offers one
 * link that opens a prefilled GitHub issue: what page it is about, where on the page, and a
 * placeholder for what is wrong. The repository comes from `SITE.repo`, so a change of host or
 * organisation moves every link at once.
 *
 * The issue body is English even on the Chinese pages: it is written into an English repository,
 * for readers of `CONTRIBUTING.md`. The link that opens it is localized.
 */
import { SITE } from '@/data/site';

export interface ReportOptions {
  /** Site-absolute path of the page, e.g. `/zh/python/closures/`. */
  path: string;
  /**
   * What to name in the "where" line: a section heading, a code block title, a question id. The
   * reader is asked to fill it in when the page cannot say.
   */
  section?: string;
}

/** The issue body: the page it is about, where on it, and what to say. */
function body({ path, section }: ReportOptions): string {
  return [
    `Page: ${SITE.url}${path}`,
    `Where: ${section ?? '(section heading, code block title or question)'}`,
    '',
    'What is wrong:',
    '',
    'What it should say:',
    '',
  ].join('\n');
}

/**
 * A `github.com/…/issues/new` URL prefilled for this page. Built from `SITE.repo`, never from a
 * hardcoded organisation, so the placeholder repository and the real one behave the same.
 */
export function reportUrl(options: ReportOptions): string {
  const query = new URLSearchParams({
    labels: 'content',
    title: `Error on ${options.path}`,
    body: body(options),
  });
  return `${SITE.repo}/issues/new?${query.toString()}`;
}
