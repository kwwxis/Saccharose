import path from 'path';
import { IMAGEDIR_WUWA_EXT } from '../../loadenv.ts';
import fs from 'fs';
import { closeKnex, openPg } from '../../util/db.ts';
import { defaultMap } from '../../../shared/util/genericUtil.ts';
import {
  ImageCategoryMap,
  ImageIndexEntity,
  ImageIndexExcelMeta,
  ImageIndexExcelMetaEntry,
} from '../../../shared/types/image-index-types.ts';

function* walkSync(dir: string, relPath: string[] = []): Generator<string> {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name), [...relPath, file.name]);
    } else {
      yield [... relPath, file.name].join('/');
    }
  }
}

function getImageNames(): string[] {
  const imageNames: string[] = [];
  for (let fileName of walkSync(IMAGEDIR_WUWA_EXT)) {
    if (!fileName.endsWith('.png')) {
      continue;
    }
    let imageName: string;
    if (fileName.includes('#')) {
      continue;
    } else {
      imageName = fileName.slice(0, -4); // Remove ".png" suffix
    }
    imageNames.push(imageName);
  }
  return imageNames;
}

export async function indexWuwaImages(dryRun: boolean = false) {
  const knex = openPg();

  if (!dryRun) {
    await knex.raw('TRUNCATE TABLE wuwa_image_index;').then();
  }

  const imageNameSetLc: Set<string> = new Set();
  const imageNameToExcelFileUsages: Record<string, string[]> = defaultMap('Array');
  const imageNameToExcelMeta: Record<string, ImageIndexExcelMeta> = defaultMap('Object');

  const catmap: ImageCategoryMap = defaultMap(() =>
    defaultMap(() =>
      defaultMap(() =>
        defaultMap(() =>
          defaultMap(() =>
            defaultMap(() =>
              defaultMap(() =>
                defaultMap(() => null)
              )
            )
          )
        )
      )
    )
  );

  console.log('Gathering image names...');
  for (let imageName of getImageNames()) {

    imageNameSetLc.add(imageName.toLowerCase());
    imageNameSetLc.add(imageName.toLowerCase() + '.png');
  }

  function findImageUsages(rows: any[]): { images: string[], imagesToExcelMetaEntry: Record<string, ImageIndexExcelMetaEntry> } {
    let images: Set<string> = new Set();
    let imagesToExcelMetaEntry: Record<string, ImageIndexExcelMetaEntry> = defaultMap(() => ({
      usageCount: 0,
      rows: [],
    }));

    for (let i = 0; i < rows.length; i++) {
      let stack = [rows[i]];
      while (stack.length) {
        let obj = stack.shift();

        if (!obj) {
          continue;
        }

        if (typeof obj === 'string') {
          let matchedImageName: string = null;

          if (obj.startsWith('/Game/Aki/UI/')) {
            obj = obj.slice('/Game/Aki/UI/'.length);
          }
          if (imageNameSetLc.has(obj.toLowerCase())) {
            matchedImageName = obj;
          } else {
            obj = obj.replace(/([^\/\\]+)\.\1$/, '$1');
            if (imageNameSetLc.has(obj.toLowerCase())) {
              matchedImageName = obj;
            }
          }
          if (matchedImageName) {
            if (matchedImageName.endsWith('.png')) {
              matchedImageName = matchedImageName.slice(0, -4);
            }
            images.add(matchedImageName);
            imagesToExcelMetaEntry[matchedImageName].usageCount++;
            imagesToExcelMetaEntry[matchedImageName].rows.push(i);
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
    return {
      images: Array.from(images),
      imagesToExcelMetaEntry,
    };
  }

  console.log('Computing excel usages...');
  for (let fileName of fs.readdirSync(path.resolve(process.env.WUWA_DATA_ROOT, './ConfigDB'))) {
    const json: any[] = JSON.parse(fs.readFileSync(path.resolve(process.env.WUWA_DATA_ROOT, './ConfigDB', fileName), 'utf-8'));
    let { images, imagesToExcelMetaEntry } = findImageUsages(json);
    for (let imageName of images) {
      imageNameToExcelFileUsages[imageName].push(fileName);
      imageNameToExcelMeta[imageName][fileName] = imagesToExcelMetaEntry[imageName];
    }
  }

  const batch: ImageIndexEntity[] = [];
  const maxBatchSize: number = 1000;

  async function commitBatch() {
    if (!dryRun) {
      await knex.transaction(function(tx) {
        return knex.batchInsert('wuwa_image_index', batch).transacting(tx);
      }).then();
    }
    batch.length = 0;
    console.log('Committed batch');
  }

  console.log('Committing...');
  for (let imageName of getImageNames()) {
    const size: number = fs.statSync(path.resolve(IMAGEDIR_WUWA_EXT, `./${imageName}.png`))?.size || 0;
    const cats: string[] = [];

    let catIdx = 0;
    let catSplits = imageName.split('/');
    if (catSplits.length > 8) {
      console.log('Large cat length ('+(catSplits.length-1)+'):', imageName);
    }
    for (let i = 0; i < catSplits.length; i++) {
      let cat = catSplits[i];
      if (i == catSplits.length - 1) {
        break;
      }
      cats[catIdx] = cat;
      catIdx++;
    }

    batch.push({
      image_name: imageName,
      image_size: size,
      excel_usages: imageNameToExcelFileUsages[imageName] || [],
      excel_meta: imageNameToExcelMeta[imageName] || {},
      image_cat1: cats[0] || null,
      image_cat2: cats[1] || null,
      image_cat3: cats[2] || null,
      image_cat4: cats[3] || null,
      image_cat5: cats[4] || null,
      image_cat6: cats[5] || null,
      image_cat7: cats[6] || null,
      image_cat8: cats[7] || null,
    });

    if (cats[0]) {
      catmap[cats[0]];
    }
    if (cats[1]) {
      catmap[cats[0]][cats[1]];
    }
    if (cats[2]) {
      catmap[cats[0]][cats[1]][cats[2]];
    }
    if (cats[3]) {
      catmap[cats[0]][cats[1]][cats[2]][cats[3]];
    }
    if (cats[4]) {
      catmap[cats[0]][cats[1]][cats[2]][cats[3]][cats[4]];
    }
    if (cats[5]) {
      catmap[cats[0]][cats[1]][cats[2]][cats[3]][cats[4]][cats[5]];
    }
    if (cats[6]) {
      catmap[cats[0]][cats[1]][cats[2]][cats[3]][cats[4]][cats[5]][cats[6]];
    }
    if (cats[7]) {
      catmap[cats[0]][cats[1]][cats[2]][cats[3]][cats[4]][cats[5]][cats[6]][cats[7]];
    }

    if (batch.length >= maxBatchSize) {
      await commitBatch();
    }
  }

  await commitBatch();

  fs.writeFileSync(
    path.resolve(process.env.WUWA_DATA_ROOT, './ImageIndexCategoryMap.json'),
    JSON.stringify(catmap, null, 2),
    'utf-8'
  );

  console.log('Done.');
  await closeKnex();
}
