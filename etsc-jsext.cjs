const fs = require('node:fs');

/**
 * @typedef {Object} JsExtPluginOptions
 * @property {boolean} verbose
 * @property {'load' | 'resolve'} method
 */

/**
 * @param {import('esbuild').OnLoadArgs} args
 * @param {JsExtPluginOptions} opts
 * @return {Promise<string>}
 */
const transformImports = async (args, opts) => {
  let changed = false;
  let contents = await fs.promises.readFile(args.path, 'utf8');

  for (const match of Array.from(contents.matchAll(/^\s*import.*\s(["'])(.*)\1\s*;?\s*$/gmi))) {
    const importStr = match[0];
    const quoteType = match[1];
    const importName = match[2];

    let transformed = importStr;

    if (importName.startsWith('.') && !importName.endsWith('.js') && !importName.endsWith('.vue')) {
      let newImportName = importName;

      if (/\.ts$/i.test(newImportName))
        newImportName = newImportName.slice(0, -3);
      if (/\.(mts|cts|tsx)$/i.test(newImportName))
        newImportName = newImportName.slice(0, -4);
      newImportName += '.js';

      transformed = transformed.replace(
        `${quoteType}${importName}${quoteType}`,
        `${quoteType}${newImportName}${quoteType}`
      );
    }

    if (importStr === transformed) {
      continue
    }

    changed = true;

    contents = contents.replace(importStr, transformed)

    if (opts.verbose) {
      console.debug(`[js-ext] ${importStr} -> ${transformed}`);
    }
  }

  if (changed && opts.verbose) {
    console.debug(`[js-ext] in ${args.path}\n`);
  }

  return contents
};

/**
 * @param {import('esbuild').OnResolveArgs} args
 * @returns {import('esbuild').OnResolveResult|undefined}
 */
async function handleResolve(args) {
  if (args.kind !== 'import-statement' && args.kind !== 'dynamic-import') {
    return;
  }
  if (args.importer && args.path.startsWith('.')) {
    const pathAlreadyHasExt = args.path.endsWith('.js');

    if (!pathAlreadyHasExt) {
      return {
        path: `${args.path}.js`,
        external: true,
        namespace: undefined
      };
    }
  }

  return {
    path: args.path,
    external: true,
    namespace: undefined,
  };
}

/**
 * @param {JsExtPluginOptions} opts
 * @return {import('esbuild').Plugin}
 */
const JsExtPlugin = (opts = {}) => {
  return {
    name: 'esbuild-jsext',
    setup(_build) {
      // noinspection JSValidateTypes
      /** @type {import('esbuild').PluginBuild} */
      const build = _build;

      if (opts.verbose) {
        console.debug('[js-ext] setup');
      }

      if (opts.method === 'load') {
        build.onLoad({ filter: /\.(ts|tsx)$/ }, async (args) => {
          let contents;

          try {
            contents = await transformImports(args, opts);
          } catch (error) {
            console.error(error);
            return null;
          }

          return { contents, loader: args.path.toLowerCase().endsWith('.tsx') ? 'tsx' : 'ts' };
        });
      }

      if (opts.method === 'resolve') {
        build.onResolve({ filter: /.*/ }, async (args) => await handleResolve(args));
      }
    }
  };
};

module.exports = JsExtPlugin;