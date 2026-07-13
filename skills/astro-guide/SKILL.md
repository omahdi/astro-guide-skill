---
name: astro-guide
description: Scaffold and build a distill.pub-inspired Astro documentation guide with data-driven D3.js grid diagrams, built with bun. Single page by default, or a multi-chapter "docbook" with a left sidebar. Use when the user asks to create a technical guide, documentation microsite, design/architecture write-up rendered as a web page, or clean D3/SVG diagrams for docs — especially "distill.pub-style", "guide with diagrams", "docbook / chapter sidebar", or "explain this design as a site".
---

# astro-guide

Build a single-page, distill.pub-style Astro guide (serif body, right-margin
callouts, hairline rules, restrained palette) with grid-based D3.js SVG diagrams.
The `assets/` here are the exact, build-tested scaffold — copy them in and author.
For a larger guide, extend that single page into a **multi-chapter docbook** with
a persistent left sidebar — see [reference/DOCBOOK.md](reference/DOCBOOK.md).

## Quick start

1. **Scaffold** into the target dir (e.g. `doc/guides/<name>/`), using bun:
   ```bash
   DEST=doc/guides/<name>
   SKILL="$(git rev-parse --show-toplevel)/skills/astro-guide"  # or the install dir of this skill
   mkdir -p "$DEST"
   cp -R "$SKILL/assets/." "$DEST/"
   mv "$DEST/gitignore" "$DEST/.gitignore"
   (cd "$DEST" && bun install && bun run build && bun run check)   # must be clean
   ```
2. **Author content** in `src/pages/index.astro` — see [reference/CONTENT.md](reference/CONTENT.md).
   Key rule: put every multi-line code snippet in a frontmatter template-string
   const and render `<pre class="code"><code>{const}</code></pre>` (Astro parses `{}`).
3. **Add diagrams** — one module per figure in `src/diagrams/<name>.ts` (copy
   `_sample.ts`), referenced by `<D3Figure name="<name>" .../>`. Grid contract,
   archetypes, and layout pitfalls: [reference/DIAGRAMS.md](reference/DIAGRAMS.md).
4. **Verify — visually, not just the build** (see below).

## What you get (the stack)

- Astro (static, bun) · `d3`. Components: `Base.astro` (article shell),
  `MarginNote.astro` (sidenote — sparingly), `Figure.astro`, `D3Figure.astro`
  (client-renders a diagram module).
- `src/diagrams/grid.ts` — the shared D3 toolkit: `grid()` layout, `palette`,
  `createSvg`, `drawNode`/`drawEdge`/`drawLegend`. Convention: **solid = today,
  dashed = planned**, with a legend where both appear.
- `src/styles/distill.css` — the design system (tune the CSS custom properties at
  the top: `--measure`, `--gutter`, `--c-accent`, serif/sans/mono stacks). Styles
  prose, code, **tables**, figures, and margin notes; `.tok` is an inline
  enum/status token (monospace, accent) for status matrices and enums.

## Workflow checklist

- [ ] Copy `assets/`, `bun install`, confirm `bun run build` + `astro check` are clean.
- [ ] Sections as direct children of `<Base>`; 3–6 anchored `<h2>`s; abstract states current state.
- [ ] One diagram per section; 6–12 nodes each; pick an archetype (DIAGRAMS.md).
- [ ] Static box diagrams by default; for a before/after or what-if, make it an interactive state-stepper — controls + linked table (INTERACTIVE.md). Figure must read complete in its default state.
- [ ] Margin notes: essential asides only, ≤ ~5 total.
- [ ] **Verify every load-bearing fact against the source** (not design docs).
- [ ] **Screenshot the running site** and fix diagram layout (CONTENT/DIAGRAMS pitfalls).
- [ ] Keep `node_modules/`, `dist/`, `.astro/` git-ignored (bundled `.gitignore`).

## Verify diagrams visually (required)

A green build does NOT mean diagrams look right — D3 renders in the browser and
labels clip / nodes overlap silently. Serve and screenshot:

```bash
(cd "$DEST" && bun run build && bun run preview --port 4399 &)   # serve
# in a scratch dir: bun add playwright && bunx playwright install chromium
node "$SKILL/scripts/shot.mjs" http://localhost:4399/ ./shots    # $SKILL = this skill's dir (see above)
```

`shot.mjs` auto-discovers every `[data-diagram]`, prints each one's rendered
`svgChildren` (0 ⇒ module failed), and writes per-diagram + top-of-page PNGs.
Read them; fix the diagram modules (DIAGRAMS.md lists the exact common fixes).
`shot.mjs` visits ONE url — for a multi-page docbook, run it once per chapter
route that has a diagram (`node "$SKILL/scripts/shot.mjs" http://localhost:4399/<slug>/ ./shots/<slug>`).

## More

- Diagram contract, archetypes, pitfalls, Distill principles → [reference/DIAGRAMS.md](reference/DIAGRAMS.md)
- Interactive figures (state-steppers, linked tables, hover linking) → [reference/INTERACTIVE.md](reference/INTERACTIVE.md)
- Content register, brace-safety, callouts, accuracy → [reference/CONTENT.md](reference/CONTENT.md)
- Multi-chapter docbook (sidebar nav across pages) → [reference/DOCBOOK.md](reference/DOCBOOK.md)
- Building a large guide with parallel subagents → [reference/ORCHESTRATION.md](reference/ORCHESTRATION.md)
