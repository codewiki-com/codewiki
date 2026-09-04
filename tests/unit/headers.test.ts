import { readFileSync } from 'node:fs';
import path from 'node:path';

function parseHeaders(source: string): Map<string, string[]> {
  const blocks = new Map<string, string[]>();
  let route: string | undefined;

  for (const line of source.split(/\r?\n/)) {
    const value = line.trim();
    if (!value || value.startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      route = value;
      blocks.set(route, []);
      continue;
    }
    if (route) blocks.get(route)?.push(value);
  }

  return blocks;
}

const blocks = parseHeaders(readFileSync(path.join(process.cwd(), 'public/_headers'), 'utf8'));
const cspLines = (route: string) =>
  (blocks.get(route) ?? []).filter((line) => /^Content-Security-Policy\s*:/i.test(line));

describe('Cloudflare response headers', () => {
  it('sets one eval-free global Content-Security-Policy', () => {
    const policies = cspLines('/*');
    expect(policies).toHaveLength(1);
    expect(policies[0]).not.toContain("'unsafe-eval'");
  });

  it('detaches the global CSP and sets one sandbox policy with the required exceptions', () => {
    const sandbox = blocks.get('/sandbox.html') ?? [];
    expect(sandbox.filter((line) => /^!\s+Content-Security-Policy$/i.test(line))).toHaveLength(1);

    const policies = cspLines('/sandbox.html');
    expect(policies).toHaveLength(1);
    expect(policies[0]).toContain("'unsafe-eval'");
    expect(policies[0]).toContain("frame-ancestors 'self'");
  });
});
