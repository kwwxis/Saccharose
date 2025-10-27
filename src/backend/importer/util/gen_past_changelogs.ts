import { pathToFileURL } from 'url';
import { GenshinVersions, StarRailVersions, WuwaVersions } from '../../../shared/types/game-versions.ts';
import { wuwaNormalize } from '../wuwa/module.normalize.ts';
import { createChangelog } from './createChangelogUtil.ts';
import { wuwaSchema } from '../wuwa/wuwa.schema.ts';
import { starRailNormalize } from '../hsr/module.normalize.ts';
import { starRailSchema } from '../hsr/hsr.schema.ts';
import { genshinSchema } from '../genshin/genshin.schema.ts';
import { genshinNormalize } from '../genshin/module.normalize.ts';
import { getWuwaControl } from '../../domain/wuwa/wuwaControl.ts';
import { getStarRailControl } from '../../domain/hsr/starRailControl.ts';
import { getGenshinControl } from '../../domain/genshin/genshinControl.ts';
import { closeKnex } from '../../util/db.ts';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await genshin();
  // await hsr();
  await closeKnex();
}

async function wuwa() {
  for (let version of WuwaVersions.list) {
    ENV.WUWA_DATA_ROOT = ENV.WUWA_ARCHIVES + '/' + version.number;
    // await wuwaNormalize();
    await createChangelog(getWuwaControl(), version.number, 'excel');
  }
}

async function hsr() {
  for (let version of StarRailVersions.list) {
    ENV.HSR_DATA_ROOT = ENV.HSR_ARCHIVES + '/' + version.number;
    // await starRailNormalize();
    await createChangelog(getStarRailControl(), version.number, 'excel');
  }
}


async function genshin() {
  for (let version of GenshinVersions.list) {
    if (!version.showTextmapChangelog) {
      continue;
    }
    ENV.GENSHIN_DATA_ROOT = ENV.GENSHIN_ARCHIVES + '/' + version.number;
    // await genshinNormalize();
    await createChangelog(getGenshinControl(), version.number, 'excel');
  }
}
