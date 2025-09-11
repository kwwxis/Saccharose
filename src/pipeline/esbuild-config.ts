import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import type { BuildOptions as EsBuildOptions } from "esbuild";

export type ESBuildUserConfig = Partial<{
  tsConfigFile?: string;
  esbuild: EsBuildOptions;
  prebuild: () => Promise<void>;
  postbuild: () => Promise<void>;
}>;

async function checkFileExists(file: string): Promise<boolean> {
  try {
    await fs.promises.access(file, fs.constants.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

export async function readUserConfig(configPath: string): Promise<ESBuildUserConfig> {
  if (await checkFileExists(configPath)) {
    try {
      const configPathUrl = path.isAbsolute(configPath)
        ? url.pathToFileURL(configPath).toString()
        : configPath;
      const { default: config } = await import(configPathUrl);
      if (config.outDir) {
        console.warn(
          "Your etsc config file is using the old v1.0 format. Please update to the new v2.0 format. Check https://github.com/a7ul/esbuild-node-tsc for details."
        );
      }
      return config;
    } catch (e) {
      console.log("Config file has some errors:");
      console.error(e);
    }
  }
  console.log("Using default config");
  return {};
}
