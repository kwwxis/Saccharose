import { pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
import { getGenshinControl } from '../../domain/genshin/genshinControl.ts';
import { closeKnex } from '../../util/db.ts';
import { GenshinVersions } from '../../../shared/types/game-versions.ts';
import { walkObject } from '../../../shared/util/arrayUtil.ts';

function* walkSync(dir: string): Generator<string> {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}
const IN_DIR: string  = 'C:/Shared/HoyoStudioYarik/Output_Texture2D_Files/';
const OUT_DIR: string = 'C:/Shared/HoyoStudioYarik/Output_Texture2D_Mentioned/';

async function doIt() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const hdiffImageNames: Set<string> = new Set();

  console.log('Collecting image names...');
  for (let filePath of walkSync(IN_DIR)) {
    if (!filePath.endsWith('.png')) {
      continue;
    }
    hdiffImageNames.add(path.basename(filePath).slice(0, -4).split('#')[0]);
  }
  console.log('Done collecting image names');

  const ctrl = getGenshinControl();
  const changelog = await ctrl.selectChangelog(GenshinVersions.find(v => v.number === '5.4'));

  console.log('Looping changelog');
  for (let excelFileChanges of Object.values(changelog.excelChangelog)) {
    for (let record of Object.values(excelFileChanges.changedRecords)) {
      let objectToWalk = {};
      if (record.changeType === 'added') {
        objectToWalk = record.addedRecord;
      } else if (record.changeType === 'updated') {
        for (let updatedField of Object.values(record.updatedFields)) {
          objectToWalk[updatedField.field] = updatedField.newValue;
        }
      } else {
        continue;
      }

      walkObject(objectToWalk, (field) => {
        if (typeof field.value === 'string' && hdiffImageNames.has(field.value)) {
          fs.copyFileSync(IN_DIR + field.value + '.png', OUT_DIR + field.value + '.png');
        }
      });
    }
  }
  console.log('Done');

  await closeKnex();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await doIt();
}
