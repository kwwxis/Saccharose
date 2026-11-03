import ts from "typescript";
import { build, context, type BuildContext } from "esbuild";
import path from "path";
import { promises as fsp } from "node:fs";
import { ESBuildUserConfig, readUserConfig } from "./esbuild-config.ts";
import { vueGenRoot } from "./vue-sfc-compile.ts";

const cwd: string = process.cwd();

async function* walkDir(dir: string): AsyncGenerator<string> {
  let dirents;
  try {
    dirents = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* walkDir(res);
    } else {
      yield res;
    }
  }
}

/**
 * Entry points for the generated Vue-SFC files under `vueGenRoot` (see `vue-sfc-compile.ts`), using
 * esbuild's `{in, out}` entry form so each one lands at the same `dist/` path it would have if it were
 * still generated alongside its `.vue` source under `src/` (what `etsc-jsext.cjs`'s import rewriting
 * expects), even though its generated `.ts` source now lives in a separate mirror directory.
 */
async function getVueGenEntries(): Promise<{ in: string; out: string }[]> {
  const entries: { in: string; out: string }[] = [];
  for await (const file of walkDir(vueGenRoot)) {
    if (file.endsWith('.ts')) {
      const absIn = file.replace(/\\/g, '/');
      const out = path.relative(vueGenRoot, file).replace(/\\/g, '/').replace(/\.ts$/, '');
      entries.push({ in: absIn, out });
    }
  }
  return entries;
}

function getTSConfig(_tsConfigFile = "tsconfig.json") {
  const tsConfigFile = ts.findConfigFile(cwd, ts.sys.fileExists, _tsConfigFile);
  if (!tsConfigFile) {
    throw new Error(`tsconfig.json not found in the current directory! ${cwd}`);
  }
  const configFile = ts.readConfigFile(tsConfigFile, ts.sys.readFile);
  const tsConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    cwd
  );
  return { tsConfig, tsConfigFile };
}

type TSConfig = ReturnType<typeof getTSConfig>["tsConfig"];

function esBuildSourceMapOptions(tsConfig: TSConfig) {
  const { sourceMap, inlineSources, inlineSourceMap } = tsConfig.options;

  // inlineSources requires either inlineSourceMap or sourceMap
  if (inlineSources && !inlineSourceMap && !sourceMap) {
    console.warn('inlineSources requires either inlineSourceMap or sourceMap');
    return false;
  }

  // Mutually exclusive in tsconfig
  if (sourceMap && inlineSourceMap) {
    console.warn('sourceMap and inlineSourceMap are mutually exclusive');
    return false;
  }

  if (inlineSourceMap) {
    return "inline";
  }

  return sourceMap;
}

async function getEsbuildMetadata(userConfig: ESBuildUserConfig) {
  const { tsConfig, tsConfigFile } = getTSConfig(userConfig.tsConfigFile);
  const esbuildConfig = userConfig.esbuild || {};

  const outdir = esbuildConfig.outdir || tsConfig.options.outDir || "dist";
  const srcFiles = [
    ...((esbuildConfig.entryPoints as string[]) ?? []),
    ...tsConfig.fileNames,
    ...(await getVueGenEntries()),
  ];
  const sourcemap =
    userConfig.esbuild?.sourcemap || esBuildSourceMapOptions(tsConfig);
  const target: string =
    esbuildConfig?.target || tsConfig?.raw?.compilerOptions?.target || "es2015";

  const esbuildOptions = {
    outbase: path.resolve(cwd, 'src').replace(/\\/g, '/'),
    ...userConfig.esbuild,
    outdir,
    entryPoints: srcFiles,
    sourcemap,
    target: target.toLowerCase(),
    tsconfig: tsConfigFile,
  };

  return { esbuildOptions };
}

export async function runEtsc(configFilename: string) {
  const config = await readUserConfig(path.resolve(cwd, configFilename));

  const { esbuildOptions } = await getEsbuildMetadata(config);

  if (config.prebuild) {
    await config.prebuild();
  }

  await build({
    bundle: false,
    format: "cjs",
    platform: "node",
    ... esbuildOptions,
  });

  if (config.postbuild) {
    await config.postbuild();
  }
}

/**
 * Creates a persistent esbuild context for incremental/watch-mode builds (see `createEtscContext`).
 * Unlike `runEtsc`, this does not run the configured prebuild/postbuild hooks, since in watch mode
 * those should typically only run once (handled by the caller) rather than on every rebuild.
 */
export async function createEtscContext(configFilename: string): Promise<BuildContext> {
  const config = await readUserConfig(path.resolve(cwd, configFilename));
  const { esbuildOptions } = await getEsbuildMetadata(config);

  return context({
    bundle: false,
    format: "cjs",
    platform: "node",
    ...esbuildOptions,
  });
}
