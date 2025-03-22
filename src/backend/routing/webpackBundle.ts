import path from 'path';
import fs from 'fs';
import { PUBLIC_DIR } from '../loadenv.ts';

export type WebpackBundles = {
  cssBundle: string,
  jsBundle: string,
  vueCssBundle: string,
};

let cache: WebpackBundles = null;

export function getWebpackBundleFileNames(): WebpackBundles {
  if (cache) {
    return cache;
  }
  let distDir = path.resolve(PUBLIC_DIR, './dist');
  let vueDistDir = path.resolve(PUBLIC_DIR, './v-dist');

  let files: string[] = fs.readdirSync(distDir);
  let vueFiles: string[] = fs.readdirSync(vueDistDir);

  let result: WebpackBundles = {
    cssBundle: '',
    jsBundle: '',
    vueCssBundle: '',
  };

  for (let file of files) {
    if (/^app(\..*)?.bundle\.css$/.test(file)) {
      result.cssBundle = `/dist/${file}`;
    }
    if (/^app(\..*)?.bundle\.js$/.test(file)) {
      result.jsBundle = `/dist/${file}`;
    }
  }

  for (let file of vueFiles) {
    if (/^vue(\..*)?.bundle\.css$/.test(file)) {
      result.vueCssBundle = `/v-dist/${file}`;
    }
  }

  cache = result;
  return result;
}
