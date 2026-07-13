# Interactive D3 figures: conventions for state-steppers and hover-linked tables

Static grid diagrams (DIAGRAMS.md) are the default. Reach for interaction only
when a figure has to show a *before/after* or a *what-if* — a fix, a regression,
a probe landing in different periods. The rules below keep interactive modules on
the same D3Figure contract, testable by Playwright, and honest (they always read
complete without a click).

## The one non-negotiable rule

**The figure must read fully in its default state.** Interaction adds depth; it
never carries the only copy of a fact. The first/default control state is exactly
what a static screenshot shows. If a reader never hovers or clicks, they still get
the whole point. A figure that is blank or meaningless until interacted with is a
bug, not a feature.

## Same contract, more DOM

An interactive module keeps the D3Figure default export `{ data, render }`.
`render(container, data)` builds three stacked regions **inside the container**,
in this order:

```
 .fig-controls   ← button group (ABOVE the svg) — also the test hook
 svg             ← the diagram (createSvg from grid.ts)
 table.fig-table ← linked schedule/period table (BELOW the svg)
```

Controls above, svg in the middle, table below. All three live in the same
`.d3-figure` container so they update together when state changes.

## Controls are real buttons (and the test hook)

State controls are real `<button>` elements, never `<div>`s or svg text:

```html
<div class="fig-controls" role="group" aria-label="…">
  <button class="fig-control" data-state="v11" aria-pressed="true">v11</button>
  <button class="fig-control" data-state="v12" aria-pressed="false">v12</button>
  <button class="fig-control" data-state="fix" aria-pressed="false">v12 + Fix</button>
</div>
```

- `data-state` is the machine name — **Playwright clicks by `[data-state="…"]`**.
- Exactly **one** button has `aria-pressed="true"` at any time; all others
  `"false"`. The CSS styles the pressed one (see distill.css `.fig-control[aria-pressed="true"]`).
- The **first** button is the default state = what the static figure shows.
- Label text is human ("v12 + Fix A"); `data-state` is terse ("fix-a").

Use `makeControls()` from `src/diagrams/interactive.ts` — it builds the group,
wires clicks, and enforces the single-`aria-pressed` invariant for you.

## State is a closure, not a re-render

Hold state in a plain closure with a single `update(state)` function. On a control
click, set the new state and call `update`. **Do not tear down and rebuild the svg
from scratch** unless the redraw is trivially cheap — re-selecting and re-styling
existing elements (opacity, fill, transform) is what makes transitions read.

```ts
export function render(container, data) {
  const svg = createSvg(container, W, H);
  const marks = /* draw everything once, in default state */;
  function update(state) {
    marks.selectAll('.period')
      .transition().duration(200)
      .attr('opacity', d => d.state === state ? 1 : 0.35);
    // …move the probe arrow, toggle the error card, etc.
  }
  makeControls(container, STATES, update);   // appends ABOVE svg
  update(STATES[0].state);                    // paint the default state
}
```

## Transitions, autoplay, touch

- **Transitions 150–250 ms**, ease-default. Long enough to see the change, short
  enough not to wait. Use `.transition().duration(200)`.
- **No autoplay, no loops.** Nothing animates until the reader acts. A figure that
  moves on its own steals attention from the prose.
- **Touch fallback: click == hover.** Anything revealed on `mouseover` must also
  open on `click` (and dismiss on a second click / outside click). `linkRows()`
  wires both. Never gate a fact behind hover alone.

## Linked tables (below the svg)

The schedule/period table is part of the figure, not separate prose. Plain
`<table class="fig-table">` using the design-system table styles:

- Numeric columns **right-aligned** (`class="num"`); enum-ish cells wrapped in
  `<span class="tok">…</span>`.
- A `.is-hot` class highlights the row the diagram is currently pointing at.
- **Two-way hover linking:** hovering an svg element highlights its table row
  (`.is-hot`), and hovering a table row highlights the svg element. Use
  `linkRows(svgSelections, tableRows)` — pass matched arrays (index i ↔ index i)
  and it wires `mouseenter`/`mouseleave` both directions plus click for touch.
- Rows that exist only in one state (a phantom period, a fix that removes a row)
  are added/removed on `update(state)`, and highlighted when they appear.

## Prose ↔ figure colour linkage

Link 2–4 key terms per chapter to their figure colour with a `.fig-ref` span:

```html
the <span class="fig-ref fig-ref--adjusted">adjusted clock</span> rolls to Monday
```

`.fig-ref` gets a coloured underline/swatch from the design system; the modifier
(`--adjusted`, `--error`, `--fix`) selects the semantic hue. Use **sparingly** —
2–4 spans per chapter, only for the load-bearing terms that appear in the figure.
Overuse turns prose into a ransom note. The hue must match the figure element
exactly (one semantic hue per concept — see DIAGRAMS.md "Distill principles").

## Semantic hues (reuse across ALL chapters)

One hue per concept, identical in every figure and every `.fig-ref`:

| concept                    | hue source                          |
|----------------------------|-------------------------------------|
| unadjusted / neutral clock | `palette.text` / `--c-text` (ink)   |
| adjusted clock / accent    | `palette.accent` / `--c-accent`     |
| error / phantom / regression | accent-red family (`--c-accent`, stronger) |
| fix                        | `palette.accentSoft` / `--c-accent-soft` |

Never recolour a concept between chapters. A reader learns "brick red = the roll"
once and relies on it everywhere.

## Helpers (src/diagrams/interactive.ts)

Dependency-free, typed, d3-only. See the file for signatures:

- `makeControls(container, states, onChange)` → appends the `.fig-controls` group
  above the svg, returns it; handles `aria-pressed` (exactly one true) and calls
  `onChange(state)` on click.
- `linkRows(svgSelections, tableRows)` → two-way hover/click highlight linking
  matched svg elements and `<tr>`s via `.is-hot`.
- `fmt(n)` → thousands-separated number string ("1,300,282.96").

## Verify (Playwright, per state)

A green build proves nothing about interaction. For each interactive figure:
click each `[data-state]`, screenshot, and confirm the default state reads
complete on its own. `scripts/shot.mjs` screenshots the default state; extend it
to click each control's `data-state` and shoot per state (DIAGRAMS.md "Verify
visually"). Confirm exactly one `aria-pressed="true"` after each click.
