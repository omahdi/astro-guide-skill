/**
 * shot.mjs — screenshot a running guide so diagrams can be visually verified.
 *
 * D3 diagrams render client-side, so a build passing does NOT mean they look
 * right. This captures each diagram container + the page top so you can inspect
 * for label clipping, node overlaps, legend/edge collisions, and typography.
 *
 * Usage:
 *   1) build + serve the guide, e.g.:
 *        bun run build && bun run preview --port 4399
 *   2) from a scratch dir with playwright installed
 *        (bun add playwright && bunx playwright install chromium):
 *        node shot.mjs http://localhost:4399/ ./shots
 *
 * Writes <outDir>/{<name>.png per diagram, top.png, full.png} and prints, for
 * each diagram, how many SVG children rendered (0 ⇒ the module failed to load).
 * Then Read the PNGs and fix the diagram modules until each is clean.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:4321/';
const outDir = process.argv[3] ?? './shots';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });

// Discover every diagram container on the page.
const names = await page.$$eval('[data-diagram]', (els) =>
  els.map((e) => e.getAttribute('data-diagram')),
);
for (const n of names) {
  try {
    await page.waitForSelector(`[data-diagram="${n}"] svg`, { timeout: 20000 });
  } catch {
    console.log(`WARN: ${n} produced no <svg> (module failed to load?)`);
  }
}
await page.waitForTimeout(500);

// Top of page (typography / hero) — capture before element shots scroll the page.
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: `${outDir}/top.png`, clip: { x: 0, y: 0, width: 1440, height: 1400 } });

for (const n of names) {
  const el = page.locator(`[data-diagram="${n}"]`);
  const kids = await page.locator(`[data-diagram="${n}"] svg > *`).count();
  console.log(`${n}: svgChildren=${kids}`);
  if (await el.count()) await el.screenshot({ path: `${outDir}/${n}.png` });
}

await page.screenshot({ path: `${outDir}/full.png`, fullPage: true });
console.log('DONE →', outDir);
await browser.close();
