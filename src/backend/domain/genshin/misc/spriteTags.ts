import { getGenshinDataFilePath } from '../../../loadenv';
import { SpriteTagExcelConfigData } from '../../../../shared/types/genshin/general-types';
import { promises as fs } from 'fs';
import { normalizeRawJson } from '../../../importer/import_db';
import { genshinSchema } from '../../../importer/genshin/genshin.schema';

export const SPRITE_TAGS: { [spriteId: number]: SpriteTagExcelConfigData } = {};

export async function loadGenshinSpriteTags(): Promise<void> {
  let filePath = getGenshinDataFilePath('./ExcelBinOutput/SpriteTagExcelConfigData.json');
  let result: SpriteTagExcelConfigData[] = await fs.readFile(filePath, { encoding: 'utf8' }).then(data => {
    let rows = JSON.parse(data);
    rows = normalizeRawJson(rows, genshinSchema.SpriteTagExcelConfigData);
    return Object.freeze(rows);
  });
  for (let row of result) {
    SPRITE_TAGS[row.Id] = row;
  }
}