/**
 * _sample.ts — the reference diagram that proves the D3Figure mechanism.
 *
 * TEMPLATE, not real content. It shows how to author a diagram module: define a
 * declarative `data` object, implement `render(container, data)` using d3 + the
 * shared grid.ts helpers, and `export default { data, render }`. Copy this file
 * to `src/diagrams/<name>.ts`, replace the data + render, and reference it with
 * `<D3Figure name="<name>" ... />`. Delete this sample once your diagrams land.
 *
 * It sketches a tiny linear pipeline with one "planned" (dashed) seam and a
 * legend, exercising every grid.ts helper: grid(), createSvg(), drawNode(),
 * drawEdge(), drawLegend().
 */

import { grid, createSvg, drawNode, drawEdge, drawLegend, type Grid } from './grid';

/** Keep data DECLARATIVE and separate from drawing. Positions are grid cells. */
export interface SampleNode {
  id: string;
  label: string;
  kicker?: string;
  col: number;
  row: number;
  colSpan?: number;
  variant?: 'solid' | 'planned';
}
export interface SampleEdge {
  from: string;
  to: string;
  variant?: 'solid' | 'planned';
  kind?: 'straight' | 'ortho';
}
export interface SampleData {
  nodes: SampleNode[];
  edges: SampleEdge[];
}

export const data: SampleData = {
  nodes: [
    { id: 'a', label: 'Producer', kicker: 'edge', col: 0, row: 0 },
    { id: 'b', label: 'Handler', kicker: 'application', col: 1, row: 0 },
    { id: 'c', label: 'Store', kicker: 'domain port', col: 2, row: 0 },
    { id: 'd', label: 'Sink', kicker: 'adapter', col: 3, row: 0 },
    { id: 'ext', label: 'Planned\nextension', kicker: 'planned seam', col: 1, row: 1, colSpan: 2, variant: 'planned' },
  ],
  edges: [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'c' },
    { from: 'c', to: 'd' },
    { from: 'b', to: 'ext', variant: 'planned', kind: 'ortho' },
  ],
};

/** Look up a node's grid-block center by id. */
function centerOf(g: Grid, nodes: SampleNode[], id: string) {
  const n = nodes.find((x) => x.id === id);
  if (!n) throw new Error(`_sample: unknown node id "${id}"`);
  return g.blockCenter(n.col, n.row, n.colSpan ?? 1, 1);
}

export function render(container: HTMLElement, d: SampleData): void {
  const width = 900;
  const height = 320;
  const g = grid({ cols: 4, rows: 2, width, height, gap: 22, padding: 14 });
  const svg = createSvg(container, width, height);

  // Edges first so nodes paint over the connector ends.
  for (const e of d.edges) {
    drawEdge(svg, centerOf(g, d.nodes, e.from), centerOf(g, d.nodes, e.to), {
      variant: e.variant ?? 'solid',
      kind: e.kind ?? 'straight',
    });
  }
  // Nodes.
  for (const n of d.nodes) {
    drawNode(svg, g.block(n.col, n.row, n.colSpan ?? 1, 1), n.label, {
      variant: n.variant ?? 'solid',
      kicker: n.kicker,
    });
  }
  // Legend, bottom-right.
  drawLegend(svg, width - 200, height - 34, [
    { label: 'integrated today', variant: 'solid' },
    { label: 'planned', variant: 'planned' },
  ]);
}

export default { data, render };
