import ts from 'typescript';
import path from 'node:path';
import process from 'node:process';

let tsConfig;
const vueTsRegex = /lang=ts/;

export default {
  loaders: [
    'esm-loader-typescript',
    'vue-esm-loader',
    {
      resolve(specifier, ctx) {
        if (!vueTsRegex.test(specifier)) {
          return;
        }
        return {
          format: 'module',
          url: new URL(specifier, ctx.parentURL).href,
        };
      },
      transform(source, ctx) {
        if (!vueTsRegex.test(ctx.url)) {
          return;
        }

        if (!tsConfig) {
          const configFileName = ts.findConfigFile(process.cwd(), ts.sys.fileExists, ctx.config || 'tsconfig.json');
          const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
          const compilerOptions = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configFileName));

          tsConfig = compilerOptions.options;
          tsConfig.inlineSourceMap = true;
          if (!tsConfig.module) tsConfig.module = ts.ModuleKind.ESNext;
        }

        const { outputText } = ts.transpileModule(String(source), {
          compilerOptions: tsConfig,
          fileName: ctx.url,
        });
        return { source: outputText };
      }
    }
  ]
}
