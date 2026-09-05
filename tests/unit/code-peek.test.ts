import { renderCodePeek } from '@/lib/code-html';

/**
 * The home page ships seven of these inside one island's props, so the peek's markup budget is
 * part of its contract: no header, no copy button, and no per-token inline styles.
 */
describe('renderCodePeek', () => {
  const code = Array.from({ length: 20 }, (_, index) => `x${index} = ${index}  # line ${index}`).join('\n');

  it('renders at most the requested number of lines', async () => {
    const html = await renderCodePeek(code, 'python', 8);
    expect(html.match(/<span class=l>/g)).toHaveLength(8);
    expect(html).toContain('# line 7');
    expect(html).not.toContain('x8');
  });

  it('carries no header, no copy button and no inline styles', async () => {
    const html = await renderCodePeek(code, 'python', 8);
    expect(html).not.toContain('codehead');
    expect(html).not.toContain('data-copy');
    expect(html).not.toContain('style=');
    expect(html).toMatch(/^<pre class=peek-code><code>/);
  });

  it('maps highlighted tokens onto the peek stylesheet classes', async () => {
    const html = await renderCodePeek('def run():\n    return "ok"\n', 'python', 8);
    expect(html).toContain('<span class=k>def</span>');
    expect(html).toContain('class=s');
    // A comment survives as a class, and the plain foreground spans are unwrapped entirely.
    const plain = await renderCodePeek('# just a comment\n', 'python', 8);
    expect(plain).toContain('class=c');
  });

  it('clips very long lines rather than shipping them', async () => {
    const html = await renderCodePeek(`value = "${'a'.repeat(400)}"`, 'python', 8);
    expect(html.length).toBeLessThan(400);
  });
});
