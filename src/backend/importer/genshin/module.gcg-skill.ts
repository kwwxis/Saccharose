import '../../loadenv.ts';
import fs from 'fs';
import { getGenshinDataFilePath } from '../../loadenv.ts';
import path from 'path';
import { GCGCharSkillDamage, GCGSkillExcelConfigData } from '../../../shared/types/genshin/gcg-types.ts';
import { standardElementCode } from '../../../shared/types/genshin/manual-text-map.ts';
import chalk from 'chalk';
import { getGenshinControl } from '../../domain/genshin/genshinControl.ts';
import { closeKnex } from '../../util/db.ts';

export async function importGcgSkill() {
  const outDir = ENV.GENSHIN_DATA_ROOT;
  const ctrl = getGenshinControl();

  const skillExcelJson: GCGSkillExcelConfigData[] = await ctrl.readExcelDataFile('GCGSkillExcelConfigData.json');
  const skillJsonNames: Set<string> = new Set<string>();
  for (let skillExcel of skillExcelJson) {
    if (skillExcel.SkillJson) {
      skillJsonNames.add(skillExcel.SkillJson);
    }
  }

  const binOutputUnknownDir = getGenshinDataFilePath('./BinOutput/GCG/Gcg_DeclaredValueSet');
  const unknownJsons = fs.readdirSync(binOutputUnknownDir).filter(file => path.extname(file) === '.json');

  const combined: { [name: string]: GCGCharSkillDamage } = {};

  for (let file of unknownJsons) {
    const fileData = fs.readFileSync(path.join(binOutputUnknownDir, file), 'utf8');
    const json: any = JSON.parse(fileData.toString());

    if (!json || typeof json !== 'object') {
      continue;
    }

    for (let [_key, value] of Object.entries(json)) {
      if (typeof value === 'string' && skillJsonNames.has(value)) {
        json.name = value;
      }
    }

    if (typeof json.name !== 'string' || !skillJsonNames.has(json.name)) {
      continue;
    }

    const name: string = json.name;
    const data: any = Object.values(json).find(v => typeof v === 'object');

    if (!data) {
      console.log('No data: ' + name + ' in ' + file);
      continue;
    }
    console.log('Encountered: ' + name + ' in ' + file);

    if (!combined[name]) {
      combined[name] = { Name: name };
    }

    function getPropValue<T>(propObject: any, propType: string|'NoType', valueMatch: (v: any) => boolean): T {
      const obj = Object.assign({}, propObject);
      let typeMatch: boolean = false;

      for (let [propName, propValue] of Object.entries(propObject)) {
        if (propValue === propType) {
          delete obj[propName];
          typeMatch = true;
          break;
        }
      }

      if (propType === 'NoType' && !typeMatch) {
        typeMatch = true;
      }

      if (!typeMatch) {
        return undefined;
      }

      delete obj['$type'];

      for (let [key, value] of Object.entries(obj)) {
        if (valueMatch(value)) {
          return value as T;
        }
      }
    }

    if (name.startsWith('Effect_Damage_')) {
      combined[name].Element = standardElementCode(name.split('_')[2].toLowerCase());
    }

    for (let propObj of Object.values(data).filter(v => !!v && typeof v === 'object')) {
      if (!combined[name].Damage)
        combined[name].Damage = getPropValue(propObj, 'NoType', v => typeof v === 'number');

      if (!combined[name].IndirectDamage)
        combined[name].IndirectDamage = getPropValue(propObj, 'IndirectDamage', v => typeof v === 'number');

      if (!combined[name].ElementTag)
        combined[name].ElementTag = getPropValue(propObj, 'Element', v => typeof v === 'string' && v.startsWith('GCG_ELEMENT'));

      if (combined[name].ElementTag && !name.startsWith('Effect_Damage_')) {
        combined[name].Element = standardElementCode(combined[name].ElementTag);
      }
    }

    if (combined[name].Element === null) {
      delete combined[name].Element;
    }

    switch (combined[name].Element) {
      case 'PYRO':
        combined[name].ElementKeywordId = 103;
        break;
      case 'HYDRO':
        combined[name].ElementKeywordId = 102;
        break;
      case 'DENDRO':
        combined[name].ElementKeywordId = 107;
        break;
      case 'ELECTRO':
        combined[name].ElementKeywordId = 104;
        break;
      case 'ANEMO':
        combined[name].ElementKeywordId = 105;
        break;
      case 'CRYO':
        combined[name].ElementKeywordId = 101;
        break;
      case 'GEO':
        combined[name].ElementKeywordId = 106;
        break;
      case 'PHYSICAL':
        combined[name].ElementKeywordId = 100;
        break;
    }
  }
  console.log(chalk.blue('Done. Output written to: ' + outDir + '/GCGCharSkillDamage.json'));
  fs.writeFileSync(outDir + '/GCGCharSkillDamage.json', JSON.stringify(combined, null, 2));
  await closeKnex();
}
