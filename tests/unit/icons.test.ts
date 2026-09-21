import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The icon set is a closed list: components reference icons by name, so a missing
// case would render an empty <svg> at build time without any error. Reading the
// source and asserting one `case` per name keeps that list honest.
const NAMES = [
  'search',
  'moon',
  'sun',
  'monitor',
  'check',
  'play',
  'copy',
  'doc',
  'chevron-down',
  'arrow-right',
  'warning',
  'info',
  'menu',
  'close',
  'external',
  'github',
] as const;

const source = readFileSync(
  fileURLToPath(new URL('../../src/components/Icon.astro', import.meta.url)),
  'utf8',
);

describe('Icon.astro', () => {
  it.each(NAMES)('has a case for %s', (name) => {
    expect(source).toContain(`case '${name}'`);
  });

  it('declares every name in the IconName union', () => {
    for (const name of NAMES) expect(source).toContain(`'${name}'`);
  });

  it('draws with currentColor so icons inherit the surrounding text colour', () => {
    expect(source).toContain('stroke="currentColor"');
  });

  it('hides icons from assistive technology', () => {
    expect(source).toContain('aria-hidden="true"');
  });
});
