import path from 'path';
import { IMAGEDIR_GENSHIN_EXT } from '../../loadenv.ts';
import fs, { promises as fsp } from 'fs';
import { closeKnex, openPg } from '../../util/db.ts';
import { isInt } from '../../../shared/util/numberUtil.ts';

interface GenshinImageIndexEntity {
  image_name: string,
  image_size: number,
  image_cat1?: string,
  image_cat2?: string,
  image_cat3?: string,
  image_cat4?: string,
  image_cat5?: string,
}

export async function indexImages() {
  const knex = openPg();

  await knex.raw('TRUNCATE TABLE genshin_image_index;').then();

  const batch: GenshinImageIndexEntity[] = [];
  const maxBatchSize: number = 1000;

  async function commitBatch() {
    await knex.transaction(function(tx) {
      return knex.batchInsert('genshin_image_index', batch).transacting(tx);
    }).then();
    batch.length = 0;
    console.log('Committed batch');
  }

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
      image_size: size,
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
