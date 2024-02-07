import { compileVueSfc, cleanVueSfc } from './src/pipeline/vue-sfc-compile';
import { runEtsc } from './src/pipeline/esbuild-tsc';

(async () => {
  console.time('Build completed');

  console.time('Vue-SFC build');
  await compileVueSfc();
  console.timeEnd('Vue-SFC build');

  await runEtsc('etsc.config.cjs');

  console.time('Vue-SFC clean');
  await cleanVueSfc();
  console.timeEnd('Vue-SFC clean');

  console.timeEnd('Build completed');
})();
