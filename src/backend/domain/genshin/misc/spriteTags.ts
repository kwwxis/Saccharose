import { getGenshinDataFilePath } from '../../../loadenv';
import { SpriteTagExcelConfigData } from '../../../../shared/types/genshin/general-types';
import { promises as fs } from 'fs';
import { normalizeRawJson, schema } from '../../../importer/import_db';

export const SPRITE_TAGS: { [spriteId: number]: SpriteTagExcelConfigData } = {};

export async function loadSpriteTags(): Promise<void> {
  let filePath = getGenshinDataFilePath('./ExcelBinOutput/SpriteTagExcelConfigData.json');
  let result: SpriteTagExcelConfigData[] = await fs.readFile(filePath, { encoding: 'utf8' }).then(data => {
    let rows = JSON.parse(data);
    rows = normalizeRawJson(rows, schema.SpriteTagExcelConfigData);
    return Object.freeze(rows);
  });
  for (let row of result) {
    SPRITE_TAGS[row.Id] = row;
  }
}