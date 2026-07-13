# D3 diagrams: the grid contract, archetypes, and layout pitfalls

Diagrams are **data-driven D3 modules on a shared grid**, not hand-placed SVG.
Consistency comes from one toolkit (`src/diagrams/grid.ts`) and one convention:
solid = integrated today, dashed = planned.

## The module contract

Each diagram is `src/diagrams/<name>.ts` with a **default export** `{ data, render }`:

```ts
export const data = { nodes: [...], edges: [...] };   // declarative, grid cells
export function render(container: HTMLElement, d): void { /* draw with grid.ts */ }
export default { data, render };
```

- Reference it: `<D3Figure name="<name>" label="Figure N" caption="…" />` (name = filename, no `.ts`).
- `D3Figure` resolves modules via `import.meta.glob('../diagrams/*.ts')` and calls `render` client-side.
- **Draw edges first, then nodes** (nodes paint over the connector ends).
- The **caption is rendered by `D3Figure`** — do NOT draw the caption inside the SVG.

## grid.ts API (read the file; it is small and commented)

- `grid({cols, rows, width, height, gap?, padding?})` → `{ cell, center, block, blockCenter, cellW, cellH }`.
  - `center(col,row)` / `block(col,row,colSpan?,rowSpan?)` (→ Rect) / `blockCenter(...)`.
- `createSvg(container, width, height)` → responsive `<svg>` with arrowhead markers.
- `drawNode(svg, rect, label, { variant:'solid'|'planned', kicker })` — label wraps on `\n`; `kicker` is a small-caps line above.
- `drawEdge(svg, a, b, { kind:'straight'|'ortho', variant, arrow, label })`.
- `drawLegend(svg, x, y, [{label, variant}])`.
- `palette` mirrors distill.css custom properties (use it for any extra hand-drawn bands/labels).

## Four archetypes (pick per diagram; keep 6–12 nodes)

- **Layered / onion** — `cols` = layers (root→application→domain→adapter). Use a faint background band + seam rule to mark published-vs-internal; small right-edge module annotations.
- **Linear pipeline** — one row, left→right; lift a side node (a sink) to the row above; drop a `planned` branch to the row below.
- **Hub-and-spoke API** — two intent rows top/bottom, a shared node (e.g. actor) on the **middle row**, a shared node (e.g. receipt) on the right middle row; route spokes with `kind:'ortho'`.
- **Swimlane flow** — `cols` = lanes, `rows` = steps; reserve a top header strip and shift the grid down; number steps via the `kicker`; forward edges `ortho`; a single dashed return edge framed through the gutters.

## Distill principles (Olah & Carter, "Attention and Augmented RNNs", 2016)

The reference standard for explanatory figures. Apply these to every diagram —
they are what separate a box-and-arrow sketch from a graphic that teaches.

1. **One semantic hue per concept, reused everywhere.** Pick a hue for each idea
   and never reuse it for anything else, in any figure. Distill uses one purple
   for the whole article; here: neutral ink = the baseline thing, `--c-accent`
   (brick red) = the thing that moved/changed, accent-soft = the fix. A reader
   learns the mapping once. Diverging data (an attention/heat matrix) is the one
   place two hues are allowed — a blue↔pink scale where blue = high, pink = low.
2. **Dechrome by default; spend colour on the one thing that matters.** Most of a
   figure is neutral greys (`--c-text-muted`, `--c-rule`). Colour is the
   exception, not the fill — it marks the single element the sentence is about.
   No gradients, no drop shadows, no decorative borders.
3. **Box only what is a thing; let structure float.** Give a rect/border to a
   real entity (a period, a node, a lender). Connectors, axes, day-cells,
   annotations float free — un-boxed. A page full of boxes has no focus.
4. **Annotate in the figure, not in a legend.** Put the label next to the thing
   it names, in-figure, with a thin leader if needed ("02.01 — rolled"). A legend
   is a fallback for when in-figure labels would collide; prefer direct labels.
   The caption carries the one-sentence takeaway, not a key.
5. **Detail strips / small-multiples for zoom-on-demand.** When one region needs
   magnification (a business-day roll across a week, a memory write), draw a
   widened *detail strip* beneath the overview at day/step granularity — Distill's
   `l-page`-width write-detail figure. Repeat the same small figure across states
   (small-multiples) so the reader compares by eye instead of by memory.
6. **Figures read complete statically first; interaction only adds depth.** Every
   figure must land its point as a still image. Hover/step reveals a second layer
   (which period contains the probe, the phantom sliver) — never the only layer.
7. **Colour-link prose to figure, sparingly.** When a term in the sentence names
   an element in the figure, give it the element's hue (a `.fig-ref` span — see
   INTERACTIVE.md). 2–4 per chapter, load-bearing terms only.
8. **Size to the idea, pace to the prose.** A figure spans the text column (or
   `figure--wide` for the overview + detail strip); it appears where the prose
   needs it (every few paragraphs), not batched. Caption below, never overlaid.

### When a table beats a diagram

Reach for a `<table>`, not an SVG, when the payload is **values you compare row
by row** — a schedule (period × amount), a contains()-verdict matrix, production
periods with epoch + date columns. A diagram shows *structure and flow*; a table
shows *exact figures and per-row truth*. Often you want both: the diagram for the
shape, a **linked table** below it for the numbers (INTERACTIVE.md), with the
diagram highlighting the row it currently points at. Numeric columns
right-aligned; enum cells in `.tok`. If a figure's only content is a grid of
numbers, it was always a table.

## Layout pitfalls (all hit in practice) and the fixes

1. **Edge mid-labels clip against adjacent nodes.** On tight/adjacent cells the label sits inside a node rect. → **Omit edge labels**; let node labels + the caption carry meaning. Keep labels only on long/open edges.
2. **A node spanning a column that also holds other nodes hides them.** A `rowSpan` box painted after single-cell boxes covers them. → **Make every node a single cell**; put a "shared" node on its own middle row/cell, never overlapping others.
3. **Long kickers overflow the node width.** → Keep kickers to a short layer/role name; move detail (`id · timestamp · caps 4000/50`) into the prose and caption.
4. **The legend lands on a node.** → Place it in an empty cell or a gutter; verify against where nodes actually are.
5. **A back/return edge routed through the middle slices the flow.** → Route it through the **gutters** (out to a side rail, cross over in the top or bottom gutter above/below all nodes, back in). Drop its inline label; the legend names it.
6. **Labels too long for a box.** → Split with `\n` into 2–3 short lines; abbreviate; the kicker holds the group/module name.
7. **Hand-drawn annotations/labels clip at the viewBox edge.** Text placed *above* the top row (`y` near 0) or routed through the *outer* gutter (`x < padding`) is silently cut off — SVG does not clip-warn. → Keep every hand-drawn `text`/edge **inside the padding**; give annotations their own empty cell, or add height and shift the grid down. Verify against the rendered PNG, not the coordinates.
8. **Annotations that duplicate the prose.** A note restating an eligibility/rule already in a table is clutter (and the thing most likely to overflow). → Cut it; let node labels + the caption + the table carry meaning. A clean 5-node diagram beats a busy 12-node one.
9. **A dashed alt/fallback edge overlaps the solid edge in its column.** Routing it out to an off-canvas side rail to avoid the overlap causes pitfall #7. → Instead **relocate the target node** so each channel/source sits directly above its target and every edge is a clean vertical; drop the redundant solid edge if the dashed one tells the story.

## Verify visually — a passing build is not enough

`bun run build` + `astro check` only prove it compiles/bundles. D3 renders in the
browser. **Always screenshot** (`scripts/shot.mjs`): it prints each diagram's
`svgChildren` count (0 ⇒ the module failed to load) and writes per-diagram PNGs.
Read them and fix collisions before committing.
