import * as sfc from '@vue/compiler-sfc';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { getSfcTransforms, SfcOptions } from './vue-sfc-options.ts';
import { fileURLToPath, pathToFileURL } from 'url';
import * as sass from 'sass';

async function* getFiles(dir: string): AsyncGenerator<string> {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = (() => {
  let curr = __dirname;
  while (true) {
    if (fs.existsSync(path.resolve(curr, './package.json'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
})();
const srcRoot = path.resolve(projectRoot, './src').replace(/\\/g, '/');
const publicVueDistDir = path.resolve(projectRoot, './public/v-dist/');

// Generated `.vue.ts` / `.vue.script.ts` / `.vue.template.ts` files are written here, mirroring the
// path of their source `.vue` file under `src/`, rather than alongside the source file itself. This
// keeps the `src/` tree free of generated files (e.g. for IDE project views). `esbuild-tsc.ts` maps
// these back to the same `dist/` output paths as before via explicit `{in, out}` entry points, so the
// final build output is unaffected.
export const vueGenRoot = path.resolve(projectRoot, './.vuegen').replace(/\\/g, '/');

/** Mirrored path under `vueGenRoot` for a given absolute `.vue` source path (without extension). */
export function vueGenPath(absSrcPath: string): string {
  return path.resolve(vueGenRoot, path.relative(srcRoot, absSrcPath)).replace(/\\/g, '/');
}

export async function cleanVueSfc() {
  await fs.promises.rm(vueGenRoot, { recursive: true, force: true });
}

// Cache of per-file compiled styles, keyed by absolute path, so that incremental/watch rebuilds
// (see `compileSingleVueFile`) can regenerate the combined CSS bundle without re-reading/recompiling
// every single .vue file's styles each time.
const stylesCache = new Map<string, string[]>();

export async function compileVueSfc() {
  const promises: Promise<void>[] = [];

  for await (let file of getFiles(srcRoot)) {
    if (file.endsWith('.vue')) {
      promises.push(compileSingleVueFile(file, { writeBundle: false }));
    }
  }

  await Promise.all(promises);
  await writeStylesBundle();
}

async function writeStylesBundle(): Promise<void> {
  const allStyles: string[] = [...stylesCache.values()].flat();
  if (!allStyles.length) {
    return;
  }
  let style: string = allStyles.join('\n\n').trim();
  let compileResult = sass.compileString(style);
  if (!fs.existsSync(publicVueDistDir)) {
    await fs.promises.mkdir(publicVueDistDir);
  }
  await fs.promises.writeFile(path.resolve(publicVueDistDir, './vue.bundle.css'), compileResult.css, {encoding: 'utf-8'})
}

/**
 * Compiles a single `.vue` file (absolute path). Used both by `compileVueSfc` (full build) and by
 * `watchVueSfc` (incremental rebuilds) so that only the changed file is re-transformed instead of
 * every `.vue` file in the project.
 */
export async function compileSingleVueFile(file: string, opts: { writeBundle?: boolean } = {}): Promise<void> {
  let absPath = file.replace(/\\/g, '/');
  let relPath = './' + path.relative(projectRoot, file).replace(/\\/g, '/');
  let baseName = path.basename(relPath);
  let genPath = vueGenPath(absPath);

  const result = await doIt({ absPath, relPath, baseName, genPath });
  stylesCache.set(absPath, result?.styles ?? []);

  if (opts.writeBundle !== false) {
    await writeStylesBundle();
  }
}

/**
 * Watches `.vue` files under `src/` and recompiles only the file that changed (plus regenerates the
 * combined CSS bundle from cache) instead of re-running a full `compileVueSfc()` pass. Intended for
 * the dev watch build (see `build-watch.ts`); assumes `compileVueSfc()` has already run once so that
 * `stylesCache` is populated for all files.
 */
export function watchVueSfc(onRebuild: (file: string) => void): fs.FSWatcher {
  // fs.watch can fire several raw events for a single file save (e.g. editors that write+rename, or
  // multiple flushes), so debounce per-file to avoid recompiling/rebuilding multiple times per save.
  const debounceMs = 100;
  const pendingTimers = new Map<string, NodeJS.Timeout>();

  return fs.watch(srcRoot, { recursive: true }, (_event, filename) => {
    if (!filename || !filename.endsWith('.vue') || filename.includes('.vue.')) {
      return;
    }
    const absPath = path.resolve(srcRoot, filename).replace(/\\/g, '/');

    clearTimeout(pendingTimers.get(absPath));
    pendingTimers.set(absPath, setTimeout(() => {
      pendingTimers.delete(absPath);

      if (!fs.existsSync(absPath)) {
        stylesCache.delete(absPath);
        return;
      }
      compileSingleVueFile(absPath).then(() => onRebuild(absPath)).catch(err => {
        console.error(`[vue-sfc watch] Failed to compile ${absPath}:`, err);
      });
    }, debounceMs));
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length < 3) {
    console.log('Not enough arguments');
    process.exit(1);
  } else if (process.argv.length > 3) {
    console.log('Too many arguments');
    process.exit(1);
  }

  if (process.argv[2] === '--compile' || process.argv[2] === '--generate' || process.argv[2] === '--transpile') {
    console.log('Vue-SFC prebuild');
    console.time('Vue-SFC postbuild');
    await compileVueSfc();
    console.timeEnd('Vue-SFC postbuild');
  } else if (process.argv[2] === '--clean' || process.argv[2] === '--cleanup') {
    console.time('Vue-SFC cleaned');
    await cleanVueSfc();
    console.timeEnd('Vue-SFC cleaned');
  } else {
    console.log('Invalid argument: ' + process.argv[2]);
    process.exit(1);
  }
}

type DoItResult = {
  styles: string[],
}

async function doIt(paths: {
  absPath: string,
  relPath: string,
  baseName: string,
  genPath: string,
}): Promise<DoItResult|undefined> {
  const { absPath, relPath, baseName, genPath } = paths;

  const fileContent: string = (await fs.promises.readFile(absPath)).toString('utf-8');
  const opts: SfcOptions = {
    renderSSR: true
  };

  const id: string =  crypto.createHash("md5").update(relPath).digest().toString("hex").substring(0, 8);

  const { descriptor } = sfc.parse(fileContent, {
    filename: relPath
  });

  if (!descriptor) {
    return;
  }

  async function transformFacade(): Promise<string> {
    const dataId = "data-v-" + id;
    let code = "";

    // Import script:
    if (descriptor.script || descriptor.scriptSetup) {
      const src = (descriptor.script && !descriptor.scriptSetup && descriptor.script.src) || relPath;
      code += `import script from "./${baseName}.script";`;

    } else {
      code += "const script = {};";
    }

    // Import styles:
    // if (descriptor.styles && descriptor.styles.length) {
    //   code += `\nimport "./${baseName}.style.scss";`;

    // }

    // Import template:
    if (descriptor.template?.content) {
      const renderFuncName = opts.renderSSR ? "ssrRender" : "render";
      code += `\nimport { ${renderFuncName} } from "./${baseName}.template.js";`;

      code += `\nscript.${renderFuncName} = ${renderFuncName};`
    }

    // Finalize:
    code += `\nscript.__file = ${JSON.stringify(relPath)};`;
    if (descriptor.styles.some(o => o.scoped)) {
      code += `\nscript.__scopeId = ${JSON.stringify(dataId)};`;
    }
    if (opts.renderSSR) {
      code += "\nscript.__ssrInlineRender = true;";
    }

    code += "\nexport default script;";
    return code;
  }

  async function transformScriptAndTemplate(): Promise<{ script: string, template: string }> {
    const script = (descriptor.script || descriptor.scriptSetup)
      ? sfc.compileScript(descriptor, {
        id,
        fs: {
          fileExists(file: string): boolean {
            return fs.existsSync(file);
          },
          readFile(file: string): string | undefined {
            return fs.readFileSync(file, { encoding: 'utf-8' });
          }
        }
      })
      : undefined;

    const templateResults = descriptor.template?.content ? sfc.compileTemplate({
      id,
      source: descriptor.template.content,
      filename: relPath,
      scoped: descriptor.styles.some(o => o.scoped),
      slotted: descriptor.slotted,
      ssr: opts.renderSSR,
      ssrCssVars: [],
      isProd: opts.minifyTemplate,
      compilerOptions: {
        inSSR: opts.renderSSR,
        directiveTransforms: getSfcTransforms(opts),
        bindingMetadata: script?.bindings,
        ...opts.compilerOptions
      }
    }) : null;

    return {
      script: script?.content || '',
      template: templateResults?.code || ''
    };
  }

  async function transformStyles(): Promise<string[]> {
    let styles: string[] = [];
    for (let style of descriptor.styles) {
      const result = await sfc.compileStyleAsync({
        filename: relPath,
        id,
        source: style.content,
        postcssOptions: opts.postcss?.options,
        postcssPlugins: opts.postcss?.plugins,
        // preprocessLang: style.lang as any,
        // preprocessOptions: Object.assign({
        //   includePaths: [
        //     path.dirname(args.path)
        //   ],
        //   importer: [
        //     (url: string) => {
        //       const modulePath = path.join(process.cwd(), "node_modules", url);
        //
        //       if (fs.existsSync(modulePath)) {
        //         return { file: modulePath }
        //       }
        //
        //       return null
        //     },
        //     (url: string) => ({ file: replaceRules(url) })
        //   ]
        // }, opts.preprocessorOptions),
        scoped: style.scoped,
      });
      styles.push(result.code);
    }
    return styles;
  }

  await Promise.all([
    fs.promises.mkdir(path.dirname(genPath), { recursive: true }),
  ]);

  await Promise.all([
    fs.promises.writeFile(genPath + '.ts', await transformFacade(), {encoding: 'utf-8'}),
    transformScriptAndTemplate().then(async (result) => {
      await fs.promises.writeFile(genPath + '.script.ts', result.script, {encoding: 'utf-8'});
      await fs.promises.writeFile(genPath + '.template.ts', result.template, {encoding: 'utf-8'});
    })
  ]);
  return {
    styles: await transformStyles()
  };
}
