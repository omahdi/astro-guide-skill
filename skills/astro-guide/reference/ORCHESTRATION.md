# Optional: building a guide with parallel subagents

For a substantial guide (several sections, 3–5 diagrams), the work parallelizes
cleanly. Do this only when the user opts into multi-agent orchestration or the
guide is large; otherwise a single pass through the same phases is fine.

## Phases (each phase's agents run in parallel; wait between phases)

1. **Source of truth first.** Write one brief that pins the facts: the current
   implemented state, the exact contract/API, and one **data spec per diagram**
   (node list with grid `(col,row)`, edge list, today/planned, caption). Verify
   it against the code. Every later agent reads this brief, so drift is contained.

2. **Two agents in parallel:**
   - *Content architect* — reads the brief + the code, produces the IA + a
     section-by-section outline with exact snippets/values + the diagram data
     specs, and flags any code-vs-doc discrepancies (trust code).
   - *Scaffold* — copies this skill's `assets/` into the target dir, `bun install`,
     verifies `bun run build`.

3. **One agent per diagram (parallel).** Each writes `src/diagrams/dN.ts` against
   `grid.ts` + its data spec. Non-overlapping files, so no conflicts. Give each
   the grid contract and its spec verbatim.

4. **Write content, then review.** One agent writes `index.astro` (sections +
   snippets + margin notes + `<D3Figure>`s). A second pass tightens prose and
   **fact-checks against the actual source**.

5. **Orchestrator verifies + fixes (do not skip).** Diagram subagents produce
   modules that *build* but frequently have layout collisions only visible when
   rendered. `bun run build && astro check`, then **screenshot** (`scripts/shot.mjs`)
   and fix the diagram modules yourself (see DIAGRAMS.md pitfalls). Then commit.

## Notes
- Prefer opus for design/architecture/diagram agents and the review pass; sonnet
  is fine for the content draft.
- Consider an **outline-review gate** between phase 1 and the writing phases: have
  a strong reviewer critique the section plan + diagram specs against the source
  *before* prose is written. It is cheap and catches structural/accuracy problems
  while they are still one edit away.
- For a **multi-chapter docbook** ([DOCBOOK.md](DOCBOOK.md)): phase 2's scaffold
  step also adds the `chapters.ts` manifest + `Sidebar.astro` + shell; write one
  page per chapter; and phase 5's screenshot pass is **per-route** (`shot.mjs`
  visits one url) — run it once per chapter that has a diagram.
- Subagents often don't commit their own files and won't self-screenshot — the
  orchestrator owns the final visual verification and the commit.
- Keep `node_modules/`, `dist/`, `.astro/` git-ignored (the bundled `.gitignore`).
