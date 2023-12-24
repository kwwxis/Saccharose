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

export async function cleanVueSfc() {
  const promises: Promise<void>[] = [];
  for await (let file of getFiles(srcRoot)) {
    if (file.endsWith('.vue.ts') || file.endsWith('.vue.script.ts') || file.endsWith('.vue.style.scss') || file.endsWith('.vue.template.ts')) {
      promises.push(fs.promises.unlink(file));
    }
  }
  await Promise.all(promises);
}

export async function compileVueSfc() {
  const allStyles: string[] = [];
  const promises: Promise<void>[] = [];

  for await (let file of getFiles(srcRoot)) {
    if (file.endsWith('.vue')) {
      let absPath = file.replace(/\\/g, '/');
      let relPath = './' + path.relative(projectRoot, file).replace(/\\/g, '/');
      let baseName = path.basename(relPath);

      promises.push(doIt({ absPath, relPath, baseName }).then(result => {
        if (result?.styles) {
          allStyles.push(... result.styles);
        }
      }));
    }
  }

  await Promise.all(promises);

  if (allStyles.length) {
    let style: string = allStyles.join('\n\n');
    let compileResult = sass.compileString(style);
    if (!fs.existsSync(publicVueDistDir)) {
      await fs.promises.mkdir(publicVueDistDir);
    }
    await fs.promises.writeFile(path.resolve(publicVueDistDir, './vue.bundle.css'), compileResult.css, {encoding: 'utf-8'})
  }
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
    await compileVueSfc();
    console.log('Vue-SFC postbuild');
  } else if (process.argv[2] === '--clean' || process.argv[2] === '--cleanup') {
    await cleanVueSfc();
    console.log('Vue-SFC cleaned');
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
}): Promise<DoItResult|undefined> {
  const { absPath, relPath, baseName } = paths;

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
    fs.promises.writeFile(absPath + '.ts', await transformFacade(), {encoding: 'utf-8'}),
    transformScriptAndTemplate().then(async (result) => {
      await fs.promises.writeFile(absPath + '.script.ts', result.script, {encoding: 'utf-8'});
      await fs.promises.writeFile(absPath + '.template.ts', result.template, {encoding: 'utf-8'});
    })
  ]);
  return {
    styles: await transformStyles()
  };
}