import { compileVueSfc, cleanVueSfc } from './vue-sfc-compile.ts';
import { runEtsc } from './esbuild-tsc.ts';
import { promises as fsp } from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';

(async () => {
  process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'));

  console.time('Build completed');

  console.time('Vue-SFC build');
  let promises: Promise<void>[] = [
    fsp.rm('./dist', {
      recursive: true,
      force: true,
    }),
    compileVueSfc()
  ];
  await Promise.all(promises);
  console.timeEnd('Vue-SFC build');

  console.time('ETSC build');
  await runEtsc('etsc.config.cjs');
  console.timeEnd('ETSC build');

  console.time('Vue-SFC clean');
  promises = [
    cleanVueSfc(),
    fsp.cp('./src/pipeline/detect_language.py', './dist/pipeline/detect_language.py', { force: true }),
  ];
  await Promise.all(promises);
  console.timeEnd('Vue-SFC clean');

  console.timeEnd('Build completed');
})();
