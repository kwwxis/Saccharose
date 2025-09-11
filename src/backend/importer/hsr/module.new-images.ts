import { StarRailVersions } from '../../../shared/types/game-versions.ts';
import fs from 'fs';
import path from 'path';
import { closeKnex } from '../../util/db.ts';
import { IMAGEDIR_HSR_ARCHIVE } from '../../loadenv.ts';

function* walkSync(dir: string, relPath: string[] = []): Generator<string> {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name), [...relPath, file.name]);
    } else {
      yield [... relPath, file.name].join('/');
    }
  }
}

function getImageNames(walkSyncDir: string): string[] {
  const imageNames: string[] = [];
  for (let fileName of walkSync(walkSyncDir)) {
    if (!fileName.endsWith('.png')) {
      continue;
    }
    let imageName: string;
    if (fileName.includes('#')) {
      continue;
    } else {
      imageName = fileName.slice(0, -4); // Remove ".png" suffix
    }
    imageNames.push(imageName);
  }
  return imageNames;
}

export async function recordNewStarRailImages() {
  const result: Record<string, string> = {};

  console.log('Recording new images...');
  for (let version of StarRailVersions.list.filter(v => v.showNewMedia)) {
    console.log('  Processing version: ' + version.number);
    for (const imageName of getImageNames(path.resolve(IMAGEDIR_HSR_ARCHIVE, `./Texture2D_${version.number}`))) {
      if (result[imageName]) {
        continue;
      }
      result[imageName] = version.number;
    }
  }

  fs.writeFileSync(
    path.resolve(ENV.HSR_DATA_ROOT, './NewImages.json'),
    JSON.stringify(result, null, 2),
    'utf-8'
  );

  console.log('Done.');
  await closeKnex();
}
