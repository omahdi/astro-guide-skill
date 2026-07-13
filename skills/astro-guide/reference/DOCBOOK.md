# Multi-chapter "docbook" variant (sidebar nav across pages)

The stock scaffold is a **single long page** (`src/pages/index.astro`). When a
guide is large enough to want chapters with a **persistent left navigation
sidebar** (a docbook), extend the scaffold as below. It is purely additive — the
distill design system, `MarginNote`, `Figure`/`D3Figure`, and `grid.ts` are
unchanged. No plugin, no MDX, no dynamic routes.

**The key fact:** Astro is already a multi-page static generator — every
`src/pages/<name>.astro` is a route. So a docbook is: a chapters *manifest*, a
*sidebar*, one *page per chapter*, and a small CSS shell.

## File delta over the stock scaffold

```
src/
  chapters.ts              # NEW — the manifest (sidebar + cover + prev/next read it)
  layouts/
    Base.astro             # CHANGED — wrap the article in a sidebar+article shell
    Sidebar.astro          # NEW — the left nav
  pages/
    index.astro            # CHANGED — becomes the cover / table of contents
    <slug>.astro           # NEW — one page per chapter (filename MUST equal slug)
  styles/
    distill.css            # CHANGED — append the "Docbook shell" block (below)
```

**Routing rule (load-bearing):** Astro derives the route from the *filename*, and
the sidebar links to `/<slug>/`. So the page file MUST be named `<slug>.astro`
(→ `/<slug>/`), **not** `NN-<slug>.astro` (→ `/NN-<slug>/`, which 404s from the
sidebar). Reading order comes from the manifest array, not a filename prefix.

## 1. The manifest — `src/chapters.ts`

```ts
export interface Chapter {
  slug: string;      // URL slug AND page filename AND <Base slug=…> — keep them equal
  title: string;     // sidebar + cover title
  lens: string;      // small-caps tag under the title
  subtitle: string;  // one-line cover/TOC summary
}

export const chapters: Chapter[] = [
  { slug: 'orientation', title: 'Orientation', lens: 'mental model',
    subtitle: 'What the thing is and the state it is in.' },
  // … one entry per chapter, in reading order …
];

export function chapterNav(slug: string): {
  current?: Chapter; prev?: Chapter; next?: Chapter; index: number;
} {
  const index = chapters.findIndex((c) => c.slug === slug);
  return {
    current: chapters[index],
    prev: index > 0 ? chapters[index - 1] : undefined,
    next: index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : undefined,
    index,
  };
}
```

## 2. The sidebar — `src/layouts/Sidebar.astro`

Pure static (no client JS); marks the active chapter by slug; links via
`BASE_URL` so it works under a sub-path.

```astro
---
import { chapters } from '../chapters.ts';
interface Props { activeSlug?: string }   // undefined on the cover
const { activeSlug } = Astro.props;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
---
<nav class="guide-sidebar" aria-label="Chapters">
  <a class="guide-sidebar__home" href={`${base}/`} aria-current={activeSlug ? undefined : 'page'}>
    <span class="guide-sidebar__kicker">Guide</span>
    <!-- guide short title -->
  </a>
  <ol class="guide-sidebar__list">
    {chapters.map((c, i) => (
      <li>
        <a class:list={['guide-sidebar__item', { 'is-active': c.slug === activeSlug }]}
           href={`${base}/${c.slug}/`}
           aria-current={c.slug === activeSlug ? 'page' : undefined}>
          <span class="guide-sidebar__num">{String(i + 1).padStart(2, '0')}</span>
          <span class="guide-sidebar__title">{c.title}</span>
        </a>
      </li>
    ))}
  </ol>
</nav>
```

## 3. The shell — `src/layouts/Base.astro`

Wrap the stock article in `.guide-shell` (sidebar + centered article). Add a
`slug` prop: it highlights the sidebar and renders prev/next. The rest of Base
(header, `.distill-body` default slot, footer) is unchanged from the scaffold.

```astro
---
import '../styles/distill.css';
import Sidebar from './Sidebar.astro';
import { chapterNav } from '../chapters.ts';
interface Props { title: string; subtitle?: string; eyebrow?: string;
  byline?: string; description?: string; slug?: string }
const { title, subtitle, eyebrow, byline, description, slug } = Astro.props;
const nav = slug ? chapterNav(slug) : undefined;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
---
<!doctype html><html lang="en"><head>…same head as the scaffold…</head>
<body>
  <div class="guide-shell">
    <Sidebar activeSlug={slug} />
    <div class="guide-main">
      <article class="distill-article">
        <header class="distill-header">…same as the scaffold…</header>
        <div class="distill-body"><slot /></div>

        {nav && (nav.prev || nav.next) && (
          <nav class="chapter-nav" aria-label="Chapter navigation">
            <div class="chapter-nav__slot">
              {nav.prev && (
                <a class="chapter-nav__link" href={`${base}/${nav.prev.slug}/`}>
                  <span class="chapter-nav__dir">← Previous</span>
                  <span class="chapter-nav__title">{nav.prev.title}</span>
                </a>
              )}
            </div>
            <div class="chapter-nav__slot chapter-nav__slot--next">
              {nav.next && (
                <a class="chapter-nav__link" href={`${base}/${nav.next.slug}/`}>
                  <span class="chapter-nav__dir">Next →</span>
                  <span class="chapter-nav__title">{nav.next.title}</span>
                </a>
              )}
            </div>
          </nav>
        )}

        <footer class="distill-footer"><slot name="footer">…</slot></footer>
      </article>
    </div>
  </div>
</body></html>
```

## 4. CSS — append this "Docbook shell" block to `src/styles/distill.css`

```css
/* ---------- docbook shell (sidebar + centered article) ---------- */
.guide-shell { display: flex; align-items: flex-start; }
.guide-sidebar {
  position: sticky; top: 0; align-self: flex-start;
  flex: 0 0 268px; width: 268px; height: 100vh; overflow-y: auto;
  padding: 44px 24px 48px 30px;
  border-right: 1px solid var(--c-rule); background: var(--c-surface);
  font-family: var(--font-sans);
}
.guide-sidebar__home {
  display: block; margin-bottom: 26px; padding-bottom: 22px;
  border-bottom: 1px solid var(--c-rule);
  font-family: var(--font-serif); font-weight: 600; font-size: 19px;
  line-height: 1.2; color: var(--c-text); text-decoration: none;
}
.guide-sidebar__kicker {
  display: block; font-family: var(--font-sans); font-size: 11px;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--c-accent);
  font-weight: 600; margin-bottom: 6px;
}
.guide-sidebar__list { list-style: none; margin: 0; padding: 0; }
.guide-sidebar__list li { margin: 2px 0; }
.guide-sidebar__item {
  display: flex; gap: 11px; align-items: baseline;
  padding: 7px 11px; border-radius: 5px; border-left: 2px solid transparent;
  color: var(--c-text-muted); text-decoration: none; font-size: 14px;
  line-height: 1.35; transition: background 0.12s ease, color 0.12s ease;
}
.guide-sidebar__item:hover { color: var(--c-text); background: rgba(0,0,0,0.035); }
.guide-sidebar__item.is-active {
  color: var(--c-text); background: var(--c-accent-soft);
  border-left-color: var(--c-accent); font-weight: 600;
}
.guide-sidebar__num { font-family: var(--font-mono); font-size: 11px; color: var(--c-text-faint); }
.guide-sidebar__item.is-active .guide-sidebar__num { color: var(--c-accent); }
.guide-main { flex: 1 1 auto; min-width: 0; }

/* prev / next chapter nav (child of .distill-article, outside the grid) */
.chapter-nav {
  display: flex; gap: 24px; max-width: var(--measure);
  margin: 44px 0 0; padding-top: 22px; border-top: 1px solid var(--c-rule);
}
.chapter-nav__slot { flex: 1 1 0; min-width: 0; }
.chapter-nav__slot--next { text-align: right; }
.chapter-nav__link { display: inline-flex; flex-direction: column; gap: 3px; text-decoration: none; border: none; }
.chapter-nav__dir {
  font-family: var(--font-sans); font-size: 11px; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--c-accent); font-weight: 600;
}
.chapter-nav__title { font-family: var(--font-serif); font-size: 17px; color: var(--c-text); }
.chapter-nav__link:hover .chapter-nav__title { color: var(--c-accent); }

/* cover / table-of-contents list (index.astro) */
.toc-list { list-style: none; margin: 1.5em 0 0; padding: 0; grid-column: main-start / gutter-end; }
.toc-list li { margin: 0; border-top: 1px solid var(--c-rule); }
.toc-list li:last-child { border-bottom: 1px solid var(--c-rule); }
.toc-list a {
  display: grid; grid-template-columns: 2.6em 1fr; gap: 4px 14px;
  align-items: baseline; padding: 14px 6px; text-decoration: none; border: none;
}
.toc-list a:hover { background: rgba(0,0,0,0.02); }
.toc-list__num { font-family: var(--font-mono); font-size: 13px; color: var(--c-text-faint); }
.toc-list__title { font-family: var(--font-serif); font-size: 20px; font-weight: 600; color: var(--c-text); }
.toc-list__lens { grid-column: 2; font-family: var(--font-sans); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--c-accent); }
.toc-list__sub { grid-column: 2; font-family: var(--font-sans); font-size: 14px; color: var(--c-text-muted); margin-top: 2px; }

/* responsive: collapse the sidebar above the article */
@media (max-width: 1080px) { .guide-sidebar { flex-basis: 236px; width: 236px; padding-left: 22px; padding-right: 18px; } }
@media (max-width: 900px) {
  .guide-shell { display: block; }
  .guide-sidebar {
    position: static; width: auto; height: auto; flex-basis: auto;
    border-right: none; border-bottom: 1px solid var(--c-rule); padding: 24px var(--page-pad);
  }
  .guide-sidebar__home { margin-bottom: 16px; padding-bottom: 14px; }
  .guide-sidebar__list { display: flex; flex-wrap: wrap; gap: 4px 6px; }
  .guide-sidebar__item { padding: 5px 9px; border-left: none; border: 1px solid var(--c-rule); }
  .guide-sidebar__item.is-active { border-color: var(--c-accent); }
}
```

## 5. The cover — `src/pages/index.astro`

`<Base>` with **no** `slug` (so no active item / prev-next); render the manifest
as the TOC:

```astro
---
import Base from '../layouts/Base.astro';
import { chapters } from '../chapters.ts';
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
---
<Base eyebrow="…" title="…" subtitle="…" byline="…">
  <p>…abstract: what it is + its current state…</p>
  <h2 id="contents">Contents</h2>
  <ol class="toc-list">
    {chapters.map((c, i) => (
      <li><a href={`${base}/${c.slug}/`}>
        <span class="toc-list__num">{String(i + 1).padStart(2, '0')}</span>
        <span class="toc-list__title">{c.title}</span>
        <span class="toc-list__lens">{c.lens}</span>
        <span class="toc-list__sub">{c.subtitle}</span>
      </a></li>
    ))}
  </ol>
</Base>
```

## 6. A chapter page — `src/pages/<slug>.astro`

```astro
---
import Base from '../layouts/Base.astro';
import MarginNote from '../components/MarginNote.astro';
import D3Figure from '../components/D3Figure.astro';
---
<Base slug="<slug>" eyebrow="Guide · Ch. N" title="…" subtitle="…">
  <p>…sections as direct children, exactly as the single-page scaffold…</p>
  <D3Figure name="d-foo" label="Figure 1" caption="…" />
</Base>
```

## Add a chapter (the whole workflow)

1. Add one object to `chapters` in `src/chapters.ts`, at the reading position you
   want — this alone updates the sidebar, the cover, and the neighbours' prev/next.
2. Create `src/pages/<slug>.astro` (copy a sibling), passing the **same** slug to
   `<Base slug="…">`. Keep filename == manifest slug == `Base` slug prop.
3. `bun run build && bun run check` (both clean).

## Gotchas specific to the docbook

- **Filename == slug.** The one hard coupling; a mismatch 404s from the sidebar.
  (If the guide grows enough that duplicating the slug across three places
  chafes, switch to a single `[...slug].astro` + `getStaticPaths()` generated
  from the manifest — but that is only worth it past ~10 chapters.)
- **Diagram verification is per-page.** `scripts/shot.mjs` visits ONE url and
  screenshots the diagrams on it, so run it once per chapter route that has a
  diagram: `node shot.mjs http://localhost:4399/<slug>/ ./shots/<slug>`.
- **Sub-path hosting.** To serve under e.g. `/guides/foo`, set `base` in
  `astro.config.mjs`; the sidebar/nav already prefix links with `BASE_URL`. Left
  unset (served at `/`) by default — note this so a local "404 at /guides/…"
  isn't mistaken for a bug.
- **Zero client JS except diagrams.** The sidebar and nav are static. Keep them
  that way (an "on this page" scroll-spy would add JS — omit unless asked).
