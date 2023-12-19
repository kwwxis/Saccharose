import path from 'path';
import fs from 'fs';
import { PUBLIC_DIR } from '../loadenv';

export type WebpackBundles = {
  appCssBundle: string,
  appJsBundle: string,
  vendorCssBundle: string,
  vendorJsBundle: string,
  vueCssBundle: string,
};

let cache: WebpackBundles = null;

export function getWebpackBundleFileNames(): WebpackBundles {
  if (cache) {
    return cache;
  }
  let distDir = path.resolve(PUBLIC_DIR, './dist');

  let files: string[] = fs.readdirSync(distDir);
  let result: WebpackBundles = {
    appCssBundle: '',
    appJsBundle: '',
    vendorCssBundle: '',
    vendorJsBundle: '',
    vueCssBundle: '',
  };

  for (let file of files) {
    if (/^app(\..*)?.bundle\.css$/.test(file)) {
      result.appCssBundle = `/dist/${file}`;
    }
    if (/^app(\..*)?.bundle\.js$/.test(file)) {
      result.appJsBundle = `/dist/${file}`;
    }
    if (/^vendor(\..*)?.bundle\.js$/.test(file)) {
      result.vendorJsBundle = `/dist/${file}`;
    }
    if (/^vendor(\..*)?.bundle\.css$/.test(file)) {
      result.vendorCssBundle = `/dist/${file}`;
    }
    if (/^vue(\..*)?.bundle\.css$/.test(file)) {
      result.vueCssBundle = `/dist/${file}`;
    }
  }
  cache = result;
  return result;
}