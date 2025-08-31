import { pathToFileURL } from 'url';
import { StarRailVersions, WuwaVersions } from '../../../shared/types/game-versions.ts';
import { wuwaNormalize } from '../wuwa/module.normalize.ts';
import { createChangelog } from './createChangelogUtil.ts';
import { wuwaSchema } from '../wuwa/wuwa.schema.ts';
import { starRailNormalize } from '../hsr/module.normalize.ts';
import { starRailSchema } from '../hsr/hsr.schema.ts';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await hsr();
}

async function wuwa() {
  for (let version of WuwaVersions) {
    ENV.WUWA_DATA_ROOT = ENV.WUWA_ARCHIVES + '/' + version.number;
    // await wuwaNormalize();
    await createChangelog(ENV.WUWA_CHANGELOGS, ENV.WUWA_ARCHIVES, wuwaSchema, WuwaVersions, version.number);
  }
}

async function hsr() {
  for (let version of StarRailVersions) {
    if (version.number !== '3.1') {
      continue;
    }
    ENV.HSR_DATA_ROOT = ENV.HSR_ARCHIVES + '/' + version.number;
    // await starRailNormalize();
    await createChangelog(ENV.HSR_CHANGELOGS, ENV.HSR_ARCHIVES, starRailSchema, StarRailVersions, version.number);
  }
}
