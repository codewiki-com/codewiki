import { COL, NODE, layoutPath } from '@/lib/pathmap';

const path = {
  milestones: [
    { id: 'm1', title: 'One', topics: ['python/a', 'python/b'] },
    { id: 'm2', title: 'Two', topics: ['python/c'] },
    { id: 'm3', title: 'Three', topics: ['python/d'] },
    { id: 'm4', title: 'Four', topics: ['python/e'] },
    { id: 'm5', title: 'Five', topics: ['python/f'] },
  ],
  edges: [
    { from: 'python/b', to: 'python/c' },
    { from: 'python/d', to: 'python/a' },
  ],
};

describe('layoutPath', () => {
  it('places five milestone columns 236 pixels apart', () => {
    const layout = layoutPath(
      path,
      () => true,
      (id) => id,
    );
    expect(layout.columns).toHaveLength(5);
    expect(layout.columns.map((column) => column.x)).toEqual([8, 244, 480, 716, 952]);
    expect(layout.columns[1]!.x - layout.columns[0]!.x).toBe(COL.w + COL.gap);
  });

  it('derives a node y coordinate from its row', () => {
    const layout = layoutPath(
      path,
      () => true,
      (id) => id,
    );
    expect(layout.nodes.find((node) => node.id === 'python/b')?.y).toBe(COL.top + NODE.h + NODE.gap);
  });

  it('drops prerequisite edges that point backwards', () => {
    const layout = layoutPath(
      path,
      () => true,
      (id) => id,
    );
    expect(layout.edges.filter((edge) => edge.kind === 'prereq')).toEqual([
      expect.objectContaining({ from: 'python/b', to: 'python/c' }),
    ]);
  });

  it('flags nodes whose topic pages do not exist', () => {
    const layout = layoutPath(
      path,
      (id) => id !== 'python/e',
      (id) => id,
    );
    expect(layout.nodes.find((node) => node.id === 'python/e')?.exists).toBe(false);
    expect(layout.nodes.find((node) => node.id === 'python/a')?.exists).toBe(true);
  });

  it('has finite positive dimensions for a one-milestone path', () => {
    const layout = layoutPath(
      { milestones: [{ id: 'm1', title: 'One', topics: ['python/a'] }], edges: [] },
      () => true,
      (id) => id,
    );
    expect(Number.isFinite(layout.width)).toBe(true);
    expect(Number.isFinite(layout.height)).toBe(true);
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });
});
