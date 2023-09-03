import fs from 'fs';
import { getGenshinDataFilePath } from '../../loadenv';
import path from 'path';
import { GCGCharSkillDamage } from '../../../shared/types/genshin/gcg-types';
import { standardElementCode } from '../../../shared/types/genshin/manual-text-map';
import chalk from 'chalk';

export async function importGcgSkill() {
  const outDir = process.env.GENSHIN_DATA_ROOT;

  const skillExcelStr = fs.readFileSync(getGenshinDataFilePath('./ExcelBinOutput/GCGSkillExcelConfigData.json'), 'utf8');
  const skillExcelJson: any[] = JSON.parse(skillExcelStr);
  const skillInternalNames: Set<string> = new Set<string>();
  for (let skillExcel of skillExcelJson) {
    if (skillExcel['ODACBHLGCIN'] || skillExcel['CCKMLPCNHFL'] || skillExcel['HHHMJFBFAKD']) {
      skillInternalNames.add(skillExcel['ODACBHLGCIN'] || skillExcel['CCKMLPCNHFL'] || skillExcel['HHHMJFBFAKD']);
    }
  }

  const binOutputUnknownDir = getGenshinDataFilePath('./BinOutput/_unknown_dir');
  const unknownJsons = fs.readdirSync(binOutputUnknownDir).filter(file => path.extname(file) === '.json');

  const combined: { [name: string]: GCGCharSkillDamage } = {};

  for (let file of unknownJsons) {
    const fileData = fs.readFileSync(path.join(binOutputUnknownDir, file), 'utf8');
    const json: any = JSON.parse(fileData.toString());

    if (json['EONPAHCMPOI']) {
      json.name = json['EONPAHCMPOI'];
    }

    if (typeof json === 'object' && typeof json.name === 'string' && skillInternalNames.has(json.name)) {
      const name: string = json.name;
      const data: any = json['NGKMIMDBNPC'] || json['ACMGJEOBIEK'] || json['ANFAJNNDLFF'] || json['CLFPJIMIPNN'];
      if (!combined[name]) {
        combined[name] = { Name: name };
      }
      if (data) {
        combined[name].Damage = data['-2060930438']?.value || data['-2060930438']?.['DLLBGDKBMIL'];
        combined[name].IndirectDamage = data['-1921818039']?.value || data['-1921818039']?.['DLLBGDKBMIL'];
        combined[name].ElementTag = data['476224977']?.ratio || data['476224977']?.['HPDLNIPCGHB'];

        if (name.startsWith('Effect_Damage_')) {
          combined[name].Element = standardElementCode(name.split('_')[2].toLowerCase());
        } else {
          combined[name].Element = standardElementCode(combined[name].ElementTag);
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
    }
  }
  console.log(chalk.blue('Done. Output written to: ' + outDir + '/GCGCharSkillDamage.json'));
  fs.writeFileSync(outDir + '/GCGCharSkillDamage.json', JSON.stringify(combined, null, 2));
}