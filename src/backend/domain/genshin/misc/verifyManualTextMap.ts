import { pathToFileURL } from 'url';
import { getGenshinControl } from '../genshinControl.ts';
import { closeKnex } from '../../../util/db.ts';
import { ManualTextMapCustomKeys, CustomTextMapKey } from './manual-text-map.ts';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ctrl = getGenshinControl();

  let longestKeyLen = 0;

  for (let key of Object.keys(ManualTextMapCustomKeys)) {
    if (key.length > longestKeyLen)
      longestKeyLen = key.length;
  }

  for (let key of Object.keys(ManualTextMapCustomKeys)) {
    console.log(`${key.padEnd(longestKeyLen, ' ')} ${await ctrl.manualtm.getTextByKey('EN', key as CustomTextMapKey)}`);
  }

  await closeKnex();
}
