/**
 * interactive.ts — tiny, dependency-free helpers for interactive D3 figures.
 *
 * Static grid diagrams use grid.ts. When a figure needs a before/after or a
 * what-if (a fix, a regression, a probe), it becomes a "state-stepper": a row of
 * real <button> controls ABOVE the svg and a linked <table> BELOW it, both inside
 * the same .d3-figure container. See reference/INTERACTIVE.md for the full
 * contract. Keep this small — it is a helper, not a widget kit. d3 only.
 *
 * The three helpers:
 *   makeControls() → the .fig-controls button group (also the Playwright hook).
 *   linkRows()     → two-way hover/click highlight between svg marks and <tr>s.
 *   fmt()          → thousands-separated number formatting for money columns.
 */

import type { Selection } from 'd3';
import { select } from 'd3';

/* ------------------------------------------------------------- makeControls */

export interface ControlState {
  /** Machine name — Playwright clicks by [data-state="..."]. Terse. */
  state: string;
  /** Human label shown on the button. */
  label: string;
}

/**
 * Append a `.fig-controls` button group as the FIRST child of `container` (above
 * the svg). Each state becomes a real <button class="fig-control" data-state=…>.
 * Exactly one button is aria-pressed="true" at a time; the first is the default.
 * Clicking a button flips aria-pressed and calls `onChange(state)`.
 *
 * Returns the group selection. Call `onChange(states[0].state)` yourself after
 * drawing to paint the default state.
 */
export function makeControls(
  container: HTMLElement,
  states: ControlState[],
  onChange: (state: string) => void,
  ariaLabel = 'figure states',
): Selection<HTMLDivElement, unknown, null, undefined> {
  const group = select(container)
    .insert('div', ':first-child')
    .attr('class', 'fig-controls')
    .attr('role', 'group')
    .attr('aria-label', ariaLabel) as Selection<
    HTMLDivElement,
    unknown,
    null,
    undefined
  >;

  const setPressed = (active: string): void => {
    group
      .selectAll<HTMLButtonElement, unknown>('button.fig-control')
      .attr('aria-pressed', function () {
        return this.dataset.state === active ? 'true' : 'false';
      });
  };

  states.forEach((s, i) => {
    group
      .append('button')
      .attr('type', 'button')
      .attr('class', 'fig-control')
      .attr('data-state', s.state)
      .attr('aria-pressed', i === 0 ? 'true' : 'false')
      .text(s.label)
      .on('click', () => {
        setPressed(s.state);
        onChange(s.state);
      });
  });

  return group;
}

/* ----------------------------------------------------------------- linkRows */

export type AnySel = Selection<any, unknown, null, undefined>;

/**
 * Two-way highlight linking. `svgSelections[i]` and `rows[i]` describe the same
 * datum: hovering either adds the `.is-hot` class to both; leaving clears it.
 * Click toggles too (touch fallback for hover). Arrays must be the same length
 * and index-aligned.
 */
export function linkRows(
  svgSelections: AnySel[],
  rows: HTMLTableRowElement[],
): void {
  const n = Math.min(svgSelections.length, rows.length);
  for (let i = 0; i < n; i++) {
    const svgSel = svgSelections[i];
    const row = rows[i];
    const on = (): void => {
      svgSel.classed('is-hot', true);
      row.classList.add('is-hot');
    };
    const off = (): void => {
      svgSel.classed('is-hot', false);
      row.classList.remove('is-hot');
    };
    svgSel.on('mouseenter', on).on('mouseleave', off);
    svgSel.on('click', () => (row.classList.contains('is-hot') ? off() : on()));
    row.addEventListener('mouseenter', on);
    row.addEventListener('mouseleave', off);
    row.addEventListener('click', () =>
      row.classList.contains('is-hot') ? off() : on(),
    );
  }
}

/* --------------------------------------------------------------------- fmt */

/**
 * Thousands-separated number: fmt(1300282.96) → "1,300,282.96". Integers keep no
 * decimals; non-integers keep up to `maxFrac` (default 2). Right-align the column.
 */
export function fmt(n: number, maxFrac = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: maxFrac,
  });
}

export default { makeControls, linkRows, fmt };
