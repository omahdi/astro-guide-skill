// @ts-check
import { defineConfig } from 'astro/config';

// Static documentation microsite. No SSR adapter — `astro build` emits a
// fully static site into ./dist. `base` keeps the guide self-contained so it
// can be served from a sub-path under the repo's doc tree if needed.
export default defineConfig({
  output: 'static',
  // Diagrams render client-side via D3; keep the default build behaviour.
  build: {
    format: 'directory',
  },
});
