import ts from "typescript";
import { build } from "esbuild";
import path from "path";
import { ESBuildUserConfig, readUserConfig } from "./esbuild-config.ts";

const cwd: string = process.cwd();

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

function getEsbuildMetadata(userConfig: ESBuildUserConfig) {
  const { tsConfig, tsConfigFile } = getTSConfig(userConfig.tsConfigFile);
  const esbuildConfig = userConfig.esbuild || {};

  const outdir = esbuildConfig.outdir || tsConfig.options.outDir || "dist";
  const srcFiles = [
    ...((esbuildConfig.entryPoints as string[]) ?? []),
    ...tsConfig.fileNames,
  ];
  const sourcemap =
    userConfig.esbuild?.sourcemap || esBuildSourceMapOptions(tsConfig);
  const target: string =
    esbuildConfig?.target || tsConfig?.raw?.compilerOptions?.target || "es2015";

  const esbuildOptions = {
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

  const { esbuildOptions } = getEsbuildMetadata(config);

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
