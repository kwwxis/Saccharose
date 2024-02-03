import path from 'path';
import { IMAGEDIR_GENSHIN_EXT } from '../../loadenv.ts';
import fs, { promises as fsp } from 'fs';
import { closeKnex, openPg } from '../../util/db.ts';
import { isInt } from '../../../shared/util/numberUtil.ts';
import { splitCamelcase } from '../../../shared/util/stringUtil.ts';
import { defaultMap } from '../../../shared/util/genericUtil.ts';

interface GenshinImageIndexEntity {
  image_name: string,
  image_fts_name: string,
  image_size: number,
  excel_usages: string[],
  image_cat1?: string,
  image_cat2?: string,
  image_cat3?: string,
  image_cat4?: string,
  image_cat5?: string,
}

function getImageNames(): string[] {
  const imageNames: string[] = [];
  for (let fileName of fs.readdirSync(IMAGEDIR_GENSHIN_EXT)) {
    let imageName: string;

    if (fileName.includes('#')) {
      continue;
    } else {
      imageName = fileName.split('.png')[0];
    }
    if (!/^(Eff_|Equip|Flycloak|Gcg|Img|MonsterSkill|Skill_|UI|.*Tutorial).*/.test(imageName)) {
      continue;
    }
    imageNames.push(imageName);
  }
  return imageNames;
}

const dry: boolean = true;



export async function indexImages() {
  const knex = openPg();

  if (!dry) {
    await knex.raw('TRUNCATE TABLE genshin_image_index;').then();
  }

  const imageNameSet: Set<string> = new Set();
  const imageNameToExcelFileUsages: Record<string, string[]> = defaultMap('Array');

  console.log('Gathering image names...');
  for (let imageName of getImageNames()) {
    imageNameSet.add(imageName);
  }

  function findImageUsages(rows: any[]): string[] {
    let images: Set<string> = new Set();
    for (let row of rows) {
      let stack = [row];
      while (stack.length) {
        let obj = stack.shift();

        if (!!obj) {
          continue;
        }

        if (typeof obj === 'string') {
          if (imageNameSet.has(obj)) {
            images.add(obj);
          } else if (obj.startsWith('ART/')) {
            const objBaseName = path.basename(obj);
            if (imageNameSet.has(objBaseName)) {
              images.add(objBaseName);
            }
          }
        }

        if (typeof obj === 'object') {
          if (Array.isArray(obj)) {
            stack.push(... obj);
          } else {
            stack.push(... Object.values(obj));
          }
        }
      }
    }
    return Array.from(images);
  }

  console.log('Computing excel usages...');
  for (let fileName of fs.readdirSync(path.resolve(process.env.GENSHIN_DATA_ROOT, './ExcelBinOutput'))) {
    const json: any[] = JSON.parse(fs.readFileSync(path.resolve(process.env.GENSHIN_DATA_ROOT, './ExcelBinOutput', fileName), 'utf-8'));
    for (let imageName of findImageUsages(json)) {
      imageNameToExcelFileUsages[imageName].push(fileName);
    }
  }

  console.log(imageNameToExcelFileUsages);

  const batch: GenshinImageIndexEntity[] = [];
  const maxBatchSize: number = 1000;

  async function commitBatch() {
    if (!dry) {
      await knex.transaction(function(tx) {
        return knex.batchInsert('genshin_image_index', batch).transacting(tx);
      }).then();
    }
    batch.length = 0;
    console.log('Committed batch');
  }

  console.log('Committing...');
  for (let imageName of getImageNames()) {
    const size: number = fs.statSync(path.resolve(IMAGEDIR_GENSHIN_EXT, `./${imageName}.png`))?.size || 0;
    const cats: string[] = [];

    let catIdx = 0;
    for (let cat of imageName.split('_')) {
      if (isInt(cat)) {
        break;
      }
      cats[catIdx] = cat;
      catIdx++;
    }

    batch.push({
      image_name: imageName,
      image_fts_name: imageName.split('_').map(p => splitCamelcase(p).join(' ')).join(' '),
      image_size: size,
      excel_usages: imageNameToExcelFileUsages[imageName] || [],
      image_cat1: cats[0] || null,
      image_cat2: cats[1] || null,
      image_cat3: cats[2] || null,
      image_cat4: cats[3] || null,
      image_cat5: cats[4] || null,
    })

    if (batch.length >= maxBatchSize) {
      await commitBatch();
    }
  }

  await commitBatch();

  console.log('Done.');
  await closeKnex();
}
