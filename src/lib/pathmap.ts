export interface MapNode {
  id: string;
  col: number;
  row: number;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  exists: boolean;
}

export interface MapDiamond {
  milestone: string;
  col: number;
  x: number;
  y: number;
  label: string;
}

export interface MapEdge {
  from: string;
  to: string;
  d: string;
  kind: 'flow' | 'prereq';
}

export interface MapLayout {
  width: number;
  height: number;
  columns: { id: string; title: string; x: number; w: number }[];
  nodes: MapNode[];
  diamonds: MapDiamond[];
  edges: MapEdge[];
}

export const NODE = { w: 180, h: 34, gap: 14 };
export const COL = { w: 212, gap: 24, padX: 16, top: 40 };

export type SvgTextKind = 'milestone' | 'node';

const SVG_TEXT_STYLE: Record<SvgTextKind, { fontSize: number; letterSpacing: number; defaultEm: number }> = {
  milestone: { fontSize: 11, letterSpacing: 0.66, defaultEm: 0.66 },
  node: { fontSize: 12.5, letterSpacing: 0, defaultEm: 0.58 },
};

/** Turns a stable topic id into reader-facing fallback copy for curriculum nodes without content. */
export function humanizeTopicId(id: string): string {
  const slug = id.split('/').at(-1) ?? id;
  const words = slug.replace(/[-_]+/g, ' ').trim();
  return words ? `${words[0]!.toUpperCase()}${words.slice(1)}` : id;
}

function glyphWidthEm(character: string, kind: SvgTextKind): number {
  if (/\p{Mark}/u.test(character)) return 0;
  if (/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u.test(character))
    return 1.05;
  if (kind === 'milestone') return SVG_TEXT_STYLE[kind].defaultEm;
  if (/\s/u.test(character)) return 0.32;
  if (/[ilI1|.,'`:;]/u.test(character)) return 0.3;
  if (/[mwMW@%&]/u.test(character)) return 0.9;
  if (/[A-Z0-9]/u.test(character)) return 0.68;
  if (/[-_()\[\]{}·]/u.test(character)) return 0.42;
  return SVG_TEXT_STYLE[kind].defaultEm;
}

/** Conservative build-time width estimate for the two font styles used by the path map. */
export function estimateSvgTextWidth(text: string, kind: SvgTextKind): number {
  const characters = [...text];
  const style = SVG_TEXT_STYLE[kind];
  const glyphs = characters.reduce((width, character) => width + glyphWidthEm(character, kind), 0);
  return glyphs * style.fontSize + Math.max(0, characters.length - 1) * style.letterSpacing;
}

/** Fits an SVG label before render because SVG text does not support CSS text-overflow. */
export function truncateSvgText(text: string, maxWidth: number, kind: SvgTextKind): string {
  if (estimateSvgTextWidth(text, kind) <= maxWidth) return text;

  const ellipsis = '…';
  let visible = '';
  for (const character of text) {
    const candidate = `${visible}${character}${ellipsis}`;
    if (estimateSvgTextWidth(candidate, kind) > maxWidth) break;
    visible += character;
  }
  return `${visible.trimEnd()}${ellipsis}`;
}

export function layoutPath(
  path: {
    milestones: { id: string; title: string; topics: string[] }[];
    edges: { from: string; to: string }[];
  },
  exists: (id: string) => boolean,
  titleOf: (id: string) => string,
): MapLayout {
  const rows = Math.max(...path.milestones.map((m) => m.topics.length));
  const height = COL.top + rows * (NODE.h + NODE.gap) + 90;
  const columns = path.milestones.map((m, i) => ({
    id: m.id,
    title: m.title,
    x: 8 + i * (COL.w + COL.gap),
    w: COL.w,
  }));
  const nodes: MapNode[] = [];
  const at = new Map<string, MapNode>();
  path.milestones.forEach((m, col) =>
    m.topics.forEach((id, row) => {
      const n = {
        id,
        col,
        row,
        x: columns[col].x + COL.padX,
        y: COL.top + row * (NODE.h + NODE.gap),
        ...NODE,
        label: titleOf(id),
        exists: exists(id),
      };
      nodes.push(n);
      at.set(id, n);
    }),
  );
  const diamonds = path.milestones.map((m, col) => ({
    milestone: m.id,
    col,
    x: columns[col].x + COL.w / 2,
    y: height - 60,
    label: '',
  }));
  const edges: MapEdge[] = [];
  for (let i = 0; i < diamonds.length - 1; i++) {
    const a = diamonds[i];
    const b = columns[i + 1];
    edges.push({
      from: a.milestone,
      to: path.milestones[i + 1].id,
      kind: 'flow',
      d: `M${a.x} ${a.y + 16} C${a.x} ${a.y + 60} ${b.x} ${a.y + 60} ${b.x} ${a.y + 30} L${b.x} ${COL.top + 20} C${b.x} ${COL.top + 6} ${b.x + 6} ${COL.top + 6} ${b.x + COL.padX} ${COL.top + 6}`,
    });
  }
  for (const e of path.edges) {
    const a = at.get(e.from);
    const b = at.get(e.to);
    if (!a || !b || a.col >= b.col) continue;
    const x1 = a.x + a.w;
    const y1 = a.y + a.h / 2;
    const x2 = b.x;
    const y2 = b.y + b.h / 2;
    edges.push({
      from: e.from,
      to: e.to,
      kind: 'prereq',
      d: `M${x1} ${y1} C${x1 + 26} ${y1} ${x2 - 26} ${y2} ${x2} ${y2}`,
    });
  }
  const width = columns[columns.length - 1].x + COL.w + 8;
  return { width, height, columns, nodes, diamonds, edges };
}
