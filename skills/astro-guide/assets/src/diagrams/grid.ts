/**
 * grid.ts — a tiny shared toolkit for the guide's D3 diagrams.
 *
 * Everything here exists so the four diagrams (D1–D4) look like they belong to
 * the same family: one muted palette, one grid layout, one way to draw a
 * labelled node and a connecting edge. Keep it small — this is a helper, not a
 * charting library.
 *
 * The mental model
 * ----------------
 *   grid(spec)  → a layout object mapping (col, row) cells to pixel x/y.
 *   drawNode()  → a rounded rect + centered label, "solid" or "planned".
 *   drawEdge()  → a straight/orthogonal connector with an optional arrowhead.
 *   palette     → the shared distill-muted colours.
 *
 * Coordinates use SVG user space. Columns/rows are 0-indexed. `cell(c, r)`
 * returns the TOP-LEFT of a cell; `center(c, r)` returns its center. A node
 * typically fills one cell (optionally spanning multiple columns/rows).
 */

import type { Selection } from 'd3';
import { select } from 'd3';

/* ------------------------------------------------------------------ palette */

/**
 * Shared palette. Mirrors the CSS custom properties in distill.css so SVG and
 * prose stay visually consistent. "solid" = integrated today; "planned" =
 * dashed / greyed seams (used by the today-vs-planned legend).
 */
export const palette = {
  bg: '#fdfdfb',
  surface: '#f6f6f2',
  text: '#1a1a1a',
  textMuted: '#6b6b6b',
  rule: '#d7d7d0',
  ruleStrong: '#b9b9b0',
  accent: '#b1361e',
  accentSoft: '#f2e3df',
  // Semantic fills for node states.
  solidFill: '#f6f6f2',
  solidStroke: '#4a4a46',
  plannedFill: '#fbfbf8',
  plannedStroke: '#b9b9b0',
} as const;

/* --------------------------------------------------------------------- grid */

export interface GridSpec {
  /** Number of columns / rows in the logical grid. */
  cols: number;
  rows: number;
  /** Outer padding (px) inside the SVG viewBox. */
  padding?: number;
  /** Gap (px) between adjacent cells. */
  gap?: number;
  /** Total drawing width / height (the SVG viewBox size), in px. */
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  width: number;
  height: number;
}

export interface Grid {
  spec: Required<GridSpec>;
  cellW: number;
  cellH: number;
  /** Top-left corner of cell (col, row). */
  cell(col: number, row: number): Point;
  /** Center of cell (col, row). */
  center(col: number, row: number): Point;
  /**
   * Rect for a block starting at (col, row) spanning `colSpan`×`rowSpan` cells
   * (gaps between spanned cells are absorbed into the block).
   */
  block(col: number, row: number, colSpan?: number, rowSpan?: number): Rect;
  /** Center of a spanned block. */
  blockCenter(col: number, row: number, colSpan?: number, rowSpan?: number): Point;
}

/**
 * Build a grid layout. Cell size is derived from the drawing size, padding,
 * gaps and the col/row count so cells tile the viewBox exactly.
 */
export function grid(spec: GridSpec): Grid {
  const full: Required<GridSpec> = {
    padding: 8,
    gap: 16,
    ...spec,
  };
  const { cols, rows, padding, gap, width, height } = full;

  const innerW = width - 2 * padding;
  const innerH = height - 2 * padding;
  const cellW = (innerW - gap * (cols - 1)) / cols;
  const cellH = (innerH - gap * (rows - 1)) / rows;

  const cell = (col: number, row: number): Point => ({
    x: padding + col * (cellW + gap),
    y: padding + row * (cellH + gap),
  });

  const block = (
    col: number,
    row: number,
    colSpan = 1,
    rowSpan = 1,
  ): Rect => {
    const tl = cell(col, row);
    return {
      x: tl.x,
      y: tl.y,
      width: colSpan * cellW + (colSpan - 1) * gap,
      height: rowSpan * cellH + (rowSpan - 1) * gap,
    };
  };

  const center = (col: number, row: number): Point => {
    const tl = cell(col, row);
    return { x: tl.x + cellW / 2, y: tl.y + cellH / 2 };
  };

  const blockCenter = (
    col: number,
    row: number,
    colSpan = 1,
    rowSpan = 1,
  ): Point => {
    const r = block(col, row, colSpan, rowSpan);
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  };

  return { spec: full, cellW, cellH, cell, center, block, blockCenter };
}

/* ------------------------------------------------------------------ svg root */

export type SvgSelection = Selection<SVGSVGElement, unknown, null, undefined>;
export type GSelection = Selection<SVGGElement, unknown, null, undefined>;

/**
 * Create a responsive <svg> inside `container` with the given viewBox size and
 * a shared arrowhead marker (id="arrow"). Returns the svg selection.
 */
export function createSvg(
  container: HTMLElement,
  width: number,
  height: number,
): SvgSelection {
  // Clear any prior render (idempotent for hot reload / re-mount).
  select(container).selectAll('*').remove();

  const svg = select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'img') as unknown as SvgSelection;

  const defs = svg.append('defs');
  for (const [id, color] of [
    ['arrow', palette.solidStroke],
    ['arrow-planned', palette.ruleStrong],
  ] as const) {
    defs
      .append('marker')
      .attr('id', id)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 5)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M 0 1 L 9 5 L 0 9 z')
      .attr('fill', color);
  }

  return svg;
}

/* ------------------------------------------------------------------- drawing */

export interface NodeOptions {
  /** "solid" = integrated today; "planned" = dashed seam. */
  variant?: 'solid' | 'planned';
  /** Small-caps kicker above the title (optional). */
  kicker?: string;
  /** Fill override. */
  fill?: string;
  /** Corner radius. */
  radius?: number;
}

/**
 * Draw a labelled node filling `rect`. Returns the <g> so callers can attach
 * more (badges, ports). Text wraps naively on `\n` in `label`.
 */
export function drawNode(
  svg: SvgSelection | GSelection,
  rect: Rect,
  label: string,
  opts: NodeOptions = {},
): GSelection {
  const { variant = 'solid', kicker, radius = 6 } = opts;
  const planned = variant === 'planned';
  const fill = opts.fill ?? (planned ? palette.plannedFill : palette.solidFill);
  const stroke = planned ? palette.plannedStroke : palette.solidStroke;

  const g = svg.append('g') as unknown as GSelection;

  g.append('rect')
    .attr('x', rect.x)
    .attr('y', rect.y)
    .attr('width', rect.width)
    .attr('height', rect.height)
    .attr('rx', radius)
    .attr('fill', fill)
    .attr('stroke', stroke)
    .attr('stroke-width', 1.25)
    .attr('stroke-dasharray', planned ? '4 3' : null);

  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const lines = label.split('\n');
  const lineH = 15;
  const kickerOffset = kicker ? 9 : 0;
  const startY = cy - ((lines.length - 1) * lineH) / 2 + kickerOffset;

  if (kicker) {
    g.append('text')
      .attr('x', cx)
      .attr('y', rect.y + 15)
      .attr('text-anchor', 'middle')
      .attr('class', 'd3-caption-label')
      .attr('fill', planned ? palette.textMuted : palette.accent)
      .text(kicker);
  }

  const text = g
    .append('text')
    .attr('x', cx)
    .attr('y', startY)
    .attr('text-anchor', 'middle')
    .attr('class', 'd3-label')
    .attr('fill', planned ? palette.textMuted : palette.text);

  lines.forEach((line, i) => {
    text
      .append('tspan')
      .attr('x', cx)
      .attr('dy', i === 0 ? 0 : lineH)
      .text(line);
  });

  return g;
}

export interface EdgeOptions {
  variant?: 'solid' | 'planned';
  /** Draw an arrowhead at the end. */
  arrow?: boolean;
  /** "straight" line, or "ortho" (right-angle) routing. */
  kind?: 'straight' | 'ortho';
  /** Optional mid-label. */
  label?: string;
}

/**
 * Draw an edge from point `a` to point `b`. "ortho" routes via an L-shaped
 * path (horizontal-then-vertical). Returns the appended <path>.
 */
export function drawEdge(
  svg: SvgSelection | GSelection,
  a: Point,
  b: Point,
  opts: EdgeOptions = {},
): void {
  const { variant = 'solid', arrow = true, kind = 'straight', label } = opts;
  const planned = variant === 'planned';
  const stroke = planned ? palette.ruleStrong : palette.solidStroke;

  const d =
    kind === 'ortho'
      ? `M ${a.x} ${a.y} L ${b.x} ${a.y} L ${b.x} ${b.y}`
      : `M ${a.x} ${a.y} L ${b.x} ${b.y}`;

  svg
    .append('path')
    .attr('d', d)
    .attr('fill', 'none')
    .attr('stroke', stroke)
    .attr('stroke-width', 1.25)
    .attr('stroke-dasharray', planned ? '4 3' : null)
    .attr(
      'marker-end',
      arrow ? (planned ? 'url(#arrow-planned)' : 'url(#arrow)') : null,
    );

  if (label) {
    svg
      .append('text')
      .attr('x', (a.x + b.x) / 2)
      .attr('y', (a.y + b.y) / 2 - 5)
      .attr('text-anchor', 'middle')
      .attr('class', 'd3-caption-label')
      .attr('fill', palette.textMuted)
      .text(label);
  }
}

/**
 * Draw a small "today vs planned" legend at (x, y). Handy for D1/D2/D4.
 */
export function drawLegend(
  svg: SvgSelection | GSelection,
  x: number,
  y: number,
  entries: Array<{ label: string; variant: 'solid' | 'planned' }>,
): void {
  const g = svg.append('g');
  entries.forEach((entry, i) => {
    const ey = y + i * 20;
    const planned = entry.variant === 'planned';
    g.append('rect')
      .attr('x', x)
      .attr('y', ey - 8)
      .attr('width', 22)
      .attr('height', 12)
      .attr('rx', 3)
      .attr('fill', planned ? palette.plannedFill : palette.solidFill)
      .attr('stroke', planned ? palette.plannedStroke : palette.solidStroke)
      .attr('stroke-width', 1.25)
      .attr('stroke-dasharray', planned ? '4 3' : null);
    g.append('text')
      .attr('x', x + 30)
      .attr('y', ey + 2)
      .attr('class', 'd3-label')
      .attr('fill', palette.textMuted)
      .text(entry.label);
  });
}
