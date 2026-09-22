import type { Root } from 'hast';
import type { VFile } from 'vfile';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { rehypeMermaidDiagrams } from '@/markdown/mermaid';

const renderer = vi.hoisted(() => ({ active: 0, peak: 0, calls: 0 }));

vi.mock('rehype-mermaid', () => ({
  default: () => async (_tree: Root, file: VFile) => {
    renderer.calls += 1;
    renderer.active += 1;
    renderer.peak = Math.max(renderer.peak, renderer.active);
    try {
      await new Promise((resolve) => setTimeout(resolve, 20));
      if (file.path.startsWith('invalid')) throw new Error('Invalid diagram');
    } finally {
      renderer.active -= 1;
    }
  },
}));

it('bounds browser work across processors and releases slots when rendering fails', async () => {
  const compile = (path: string, value = '```mermaid\nflowchart LR\nA --> B\n```') =>
    unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeMermaidDiagrams)
      .use(rehypeStringify)
      .process({ path, value });

  // Both occupied slots fail before the queued documents can render.
  const results = await Promise.allSettled([
    compile('invalid-1.mdx'),
    compile('invalid-2.mdx'),
    ...Array.from({ length: 6 }, (_, index) => compile(`valid-${index}.mdx`)),
    compile('plain.mdx', 'A document without diagrams.'),
  ]);

  expect(results.filter((result) => result.status === 'rejected')).toHaveLength(2);
  expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(7);
  expect(renderer.peak).toBe(2);
  expect(renderer.active).toBe(0);
  expect(renderer.calls).toBe(8);
  await expect(compile('after-failures.mdx')).resolves.toBeDefined();
});
