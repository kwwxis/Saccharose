import { getGenshinControl } from '../genshin/genshinControl.ts';
import { getZenlessControl } from './zenlessControl.ts';
import { closeKnex } from '../../util/db.ts';
import { defaultMap } from '../../../shared/util/genericUtil.ts';
import { sort } from '../../../shared/util/arrayUtil.ts';


const ctrl = getZenlessControl();

const items: any[] = Object.values(<any> (await ctrl.readExcelDataFile('ItemTemplateTb.json')))[0] as any[];

const out_weapon: Record<string, Set<number>> = defaultMap('Set');
const out_driveDisc: Record<string, Set<number>> = defaultMap('Set');
const out_agent: Record<string, Set<number>> = defaultMap('Set');
const out_item: Record<string, Set<number>> = defaultMap('Set');

for (let item of items) {
  if (item.NameTextMapHash) {
    let nameText = await ctrl.getTextMapItem('EN', item.NameTextMapHash);
    if (nameText) {
      if (nameText.endsWith(']')) {
        nameText = nameText.replace(/\[([^\]]+)]$/, '$1')
      } else if (nameText.startsWith('[')) {
        nameText = nameText.replace(/^\[[^\]]+]\s*/, '')
      }
      if (nameText.includes(']')) {
        console.log('-- Skipped: ' + nameText);
        continue;
      }

      if (item.NameTextMapHash.toLowerCase().startsWith('item_weapon_')) {
        out_weapon[nameText].add(item.Rarity);
      } else if (item.NameTextMapHash.toLowerCase().startsWith('item_equipment') || item.NameTextMapHash.toLowerCase().startsWith('equipmentsuit')) {
        out_driveDisc[nameText].add(item.Rarity);
      } else if (item.NameTextMapHash.toLowerCase().startsWith('avatar')) {
        out_agent[nameText].add(item.Rarity);
      } else {
        out_item[nameText].add(item.Rarity);
      }
    }
  }
}

for (let stuff of [out_agent, out_driveDisc, out_item]) {
  console.log('return {');
  let entries = Object.entries(stuff);
  sort(entries, '0');
  for (let [name, rarities] of entries) {
    let rank = sort(Array.from(rarities), '-').map(rarity => {
      switch (rarity) {
        case 1:
          return 'C';
        case 2:
          return 'B';
        case 3:
          return 'A';
        case 4:
          return 'S';
        case 5:
          return null;
      }
    }).filter(x => !!x).join(';');

    console.log(`    [${JSON.stringify(name)}] = { rank = '${rank}' },`);
  }
  console.log('}')
}

await closeKnex();
