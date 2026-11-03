import { compileVueSfc, watchVueSfc } from './vue-sfc-compile.ts';
import { createEtscContext } from './esbuild-tsc.ts';
import { promises as fsp } from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Dev-only incremental build: unlike `build.ts` (which does a full rebuild from scratch every time
// it's invoked), this script runs once, does an initial full build, then keeps an esbuild watch
// context + a `.vue` file watcher alive so that subsequent changes only recompile the file(s) that
// actually changed. Pair with a `nodemon.dev.json` that watches `dist/` and just restarts `node .`,
// instead of re-running the whole build on every change.
(async () => {
  process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'));

  console.time('Initial build');

  console.time('Vue-SFC build');
  await fsp.rm('./dist', {
    recursive: true,
    force: true,
  });
  await compileVueSfc();
  console.timeEnd('Vue-SFC build');

  console.time('ETSC build');
  const ctx = await createEtscContext('etsc.config.cjs');
  await ctx.rebuild();
  console.timeEnd('ETSC build');

  await fsp.cp('./src/pipeline/detect_language.py', './dist/pipeline/detect_language.py', { force: true });

  console.timeEnd('Initial build');

  // NOTE: generated `.vue.ts` / `.vue.script.ts` / `.vue.template.ts` files are intentionally left in
  // place (no `cleanVueSfc()` call) since the watch context keeps recompiling from/into them.

  await ctx.watch();
  console.log('[build-watch] Watching src/backend and src/shared for changes (esbuild + .vue)...');

  const vueWatcher = watchVueSfc((file) => {
    console.log(`[build-watch] Recompiled ${path.relative(process.cwd(), file)}`);
    // Re-trigger the esbuild rebuild so the newly (re)generated .vue.ts/.script.ts/.template.ts
    // files are picked up; esbuild's own watch already handles plain .ts/.js changes on its own.
    ctx.rebuild().catch(err => console.error('[build-watch] esbuild rebuild failed:', err));
  });

  const shutdown = async () => {
    vueWatcher.close();
    await ctx.dispose();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();
