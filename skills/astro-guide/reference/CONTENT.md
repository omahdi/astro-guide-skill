# Authoring the guide content (distill.pub register)

The page is a single long-form article (`src/pages/index.astro`) with anchored
sections. Author sections as **direct children of `<Base>`** so the distill grid
places them.

## The one Astro gotcha: braces in code

Astro parses `{ }` in templates as JS expressions, so raw braces in a code block
break the build. Put **every multi-line snippet** (Kotlin, TS, JSON, log lines)
in a frontmatter template-string constant and interpolate it (Astro escapes the
output as literal text):

```astro
---
const contract = `interface Handler {
  fun handle(cmd: Command): Receipt
}`;
---
<pre class="code"><code>{contract}</code></pre>
```

Inline code without braces can use `<code>…</code>` directly. Never put a bare
`{` or `}` in the template body outside a string/expression. To emit a *literal*
brace inline (e.g. describing a `{placeholder}` in prose), use a JS-string
expression: `{'{last_revision.version}'}` renders the text `{last_revision.version}`.

## Structure

- Open with the Base header (`eyebrow`, `title`, `subtitle`, `byline`) + a short
  abstract paragraph that states what the system is **and its current state**.
- `<h2 id="anchor">` per section; keep 3–6 sections.
- Tables are plain `<table>`, styled by the scaffold — use them for enumerations
  (status matrices, field/type/notes, op indexes). A field/nullability/value-source
  table often beats a diagram; prefer it. Wrap a wide table in `<Figure wide>` to
  span the main column + gutter.
- End each section with its `<D3Figure>` (some sections carry a table instead).

## Margin notes — rare and essential (≤ ~5 per page)

`<MarginNote label="Note">…</MarginNote>` placed **immediately after** the
paragraph it annotates. Reserve for genuinely marginal, essential asides that add
an angle the paragraph doesn't state (a constraint, a "never", a gotcha) — not
restatements. If a note just echoes its paragraph, cut it.

## Voice

- Engineering-doc register; precise, concise; no marketing adjectives, no hedging.
- Present tense for what exists; explicit **"planned" / "not built"** for seams —
  never overstate. Render a today-vs-planned table when the split matters.
- Prefer a table or the diagram over a long paragraph when enumerating.
- Give exact values and names (paths, status codes, caps, type names, case-correct).

## Accuracy is load-bearing

A guide that drifts from the code is worse than none. **Verify every load-bearing
claim against the source** (endpoints, status codes, field lists, caps, rules) —
read the actual files, don't trust prose or design docs (docs may describe a
superseded iteration). Keep a short "banned terms" list of any renamed/removed
identifiers so they don't creep back in.
