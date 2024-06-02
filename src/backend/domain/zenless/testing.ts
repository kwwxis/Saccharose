import { getGenshinControl } from '../genshin/genshinControl.ts';
import { getZenlessControl } from './zenlessControl.ts';
import { closeKnex } from '../../util/db.ts';


getGenshinControl();

const ctrl = getZenlessControl();

const items: any[] = (<any> (await ctrl.readExcelDataFile('ItemTemplateCollection.json')))[0];

const rarities: Set<number> = new Set();

for (let item of items) {
  if (item.Name) {
    let nameText = await ctrl.getTextMapItem('EN', item.Name);
    if (nameText) {
      console.log(nameText, item.Rarity);
      rarities.add(item.Rarity);
    }
  }
}
console.log(rarities);
await closeKnex();
