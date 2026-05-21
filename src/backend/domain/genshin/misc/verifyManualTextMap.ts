import { pathToFileURL } from 'url';
import { getGenshinControl } from '../genshinControl.ts';
import { closeKnex } from '../../../util/db.ts';
import { ManualTextMapHashes } from '../../../../shared/types/genshin/manual-text-map.ts';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ctrl = getGenshinControl();

  let longestKeyLen = 0;

  for (let key of Object.keys(ManualTextMapHashes)) {
    if (key.length > longestKeyLen)
      longestKeyLen = key.length;
  }

  for (let [key, hash] of Object.entries(ManualTextMapHashes)) {
    console.log(`${key.padEnd(longestKeyLen, ' ')} ${String(hash).padEnd(20, ' ')} ${await ctrl.getTextMapItem('EN', hash)}`);
  }

  await closeKnex();
}
