import { GenshinVersions } from '../../../shared/types/game-versions.ts';
import fs from 'fs';
import path from 'path';
import { IMAGEDIR_GENSHIN_ARCHIVE } from '../../loadenv.ts';
import { closeKnex } from '../../util/db.ts';

export async function recordNewGenshinImages() {
  const result: Record<string, string> = {};

  console.log('Recording new images...');
  for (let version of GenshinVersions.list.filter(v => v.showNewMedia)) {
    console.log('  Processing version: ' + version.number);
    for (const fileName of fs.readdirSync(path.resolve(IMAGEDIR_GENSHIN_ARCHIVE, `./Texture2D_${version.number}`))) {
      if (!fileName.endsWith('.png')) {
        continue;
      }

      const imageName: string = fileName.slice(0, -4); // remove '.png'
      if (result[imageName]) {
        continue;
      }
      result[imageName] = version.number;
    }
  }

  fs.writeFileSync(
    path.resolve(ENV.GENSHIN_DATA_ROOT, './NewImages.json'),
    JSON.stringify(result, null, 2),
    'utf-8'
  );

  console.log('Done.');
  await closeKnex();
}
