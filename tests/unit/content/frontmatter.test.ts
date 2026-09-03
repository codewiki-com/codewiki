import { parseFrontmatter, serializeFrontmatter } from '../../../scripts/content/lib/frontmatter';
describe('frontmatter', () => {
  it('round-trips and keeps key order', () => {
    const src = '---\ntitle: "A"\ncategory: "Python"\n---\nbody\n';
    const { data, body } = parseFrontmatter(src);
    expect(data).toEqual({ title: 'A', category: 'Python' });
    expect(body).toBe('body\n');
    expect(serializeFrontmatter({ title: 'A', tags: ['x'] }, 'body\n')).toBe(
      '---\ntitle: A\ntags:\n  - x\n---\nbody\n',
    );
  });
});
