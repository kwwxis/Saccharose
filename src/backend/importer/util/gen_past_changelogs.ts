import { pathToFileURL } from 'url';
import { GenshinVersions, StarRailVersions, WuwaVersions } from '../../../shared/types/game-versions.ts';
import { wuwaNormalize } from '../wuwa/module.normalize.ts';
import { createChangelog } from './createChangelogUtil.ts';
import { wuwaSchema } from '../wuwa/wuwa.schema.ts';
import { starRailNormalize } from '../hsr/module.normalize.ts';
import { starRailSchema } from '../hsr/hsr.schema.ts';
import { genshinSchema } from '../genshin/genshin.schema.ts';
import { genshinNormalize } from '../genshin/module.normalize.ts';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await genshin();
  // await hsr();
}

async function wuwa() {
  for (let version of WuwaVersions.list) {
    ENV.WUWA_DATA_ROOT = ENV.WUWA_ARCHIVES + '/' + version.number;
    // await wuwaNormalize();
    await createChangelog(ENV.WUWA_CHANGELOGS, ENV.WUWA_ARCHIVES, wuwaSchema, WuwaVersions, version.number);
  }
}

async function hsr() {
  for (let version of StarRailVersions.list) {
    if (version.number !== '3.1') {
      continue;
    }
    ENV.HSR_DATA_ROOT = ENV.HSR_ARCHIVES + '/' + version.number;
    // await starRailNormalize();
    await createChangelog(ENV.HSR_CHANGELOGS, ENV.HSR_ARCHIVES, starRailSchema, StarRailVersions, version.number);
  }
}


async function genshin() {
  for (let version of GenshinVersions.list) {
    if (!version.showTextmapChangelog) {
      continue;
    }
    if (version.number === '4.0') {
      break;
    }
    ENV.GENSHIN_DATA_ROOT = ENV.GENSHIN_ARCHIVES + '/' + version.number;
    // await genshinNormalize();
    await createChangelog(ENV.GENSHIN_CHANGELOGS, ENV.GENSHIN_ARCHIVES, genshinSchema, GenshinVersions, version.number);
  }
}
