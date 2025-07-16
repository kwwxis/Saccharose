import path from 'path';
import { IMAGEDIR_HSR_EXT } from '../../loadenv.ts';
import fs from 'fs';
import { closeKnex, openPgSite } from '../../util/db.ts';
import { defaultMap } from '../../../shared/util/genericUtil.ts';
import {
  ImageCategoryMap,
  ImageIndexEntity,
  ImageIndexExcelMeta,
  ImageIndexExcelMetaEntry, newImageCategory,
} from '../../../shared/types/image-index-types.ts';
import { imageSizeFromFile, ISizeCalculationResult } from '../../util/image-size';

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
  for (let fileName of walkSync(IMAGEDIR_HSR_EXT)) {
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

export async function indexStarRailImages(catMapOnly: boolean = false) {
  const knex = openPgSite();

  if (!catMapOnly) {
    await knex.raw('TRUNCATE TABLE hsr_image_index;').then();
  }

  const imageNameSetLc: Set<string> = new Set();
  const imageNameToExcelFileUsages: Record<string, string[]> = defaultMap('Array');
  const imageNameToExcelMeta: Record<string, ImageIndexExcelMeta> = defaultMap('Object');

  const catmap: ImageCategoryMap = newImageCategory('root');

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
          if (imageNameSetLc.has(obj.toLowerCase())) {
            matchedImageName = obj;
          }
          if (matchedImageName) {
            if (matchedImageName.endsWith('.png')) {
              matchedImageName = matchedImageName.slice(0, -4);
            }
            if (matchedImageName.includes('/')) {
              let parts: string[] = matchedImageName.split('/');
              matchedImageName = parts.slice(0, -1).join('/').toLowerCase() + '/' + parts[parts.length - 1];
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
  for (let fileName of fs.readdirSync(path.resolve(ENV.HSR_DATA_ROOT, './ExcelOutput'))) {
    const json: any[] = JSON.parse(fs.readFileSync(path.resolve(ENV.HSR_DATA_ROOT, './ExcelOutput', fileName), 'utf-8'));
    let { images, imagesToExcelMetaEntry } = findImageUsages(json);
    for (let imageName of images) {
      imageNameToExcelFileUsages[imageName].push(fileName);
      imageNameToExcelMeta[imageName][fileName] = imagesToExcelMetaEntry[imageName];
    }
  }

  const batch: ImageIndexEntity[] = [];
  const maxBatchSize: number = 1000;

  async function commitBatch() {
    if (!catMapOnly) {
      await knex.transaction(function(tx) {
        return knex.batchInsert('hsr_image_index', batch).transacting(tx);
      }).then();
    }
    batch.length = 0;
    console.log('Committed batch');
  }

  console.log('Committing...');
  for (let imageName of getImageNames()) {
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

    if (!catMapOnly) {
      const filePath: string = path.resolve(IMAGEDIR_HSR_EXT, `./${imageName}.png`);
      const byteSize: number = fs.statSync(filePath)?.size || 0;
      const imageSize: ISizeCalculationResult = await imageSizeFromFile(filePath);
      batch.push({
        image_name: imageName,
        image_size: byteSize,
        image_width: imageSize.width,
        image_height: imageSize.height,
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
    }

    let currCat = catmap;
    for (let cat of cats) {
      currCat = currCat.children[cat];
    }

    if (!catMapOnly && batch.length >= maxBatchSize) {
      await commitBatch();
    }
  }

  if (!catMapOnly) {
    await commitBatch();
  }

  fs.writeFileSync(
    path.resolve(ENV.HSR_DATA_ROOT, './ImageIndexCategoryMap.json'),
    JSON.stringify(catmap, null, 2),
    'utf-8'
  );

  console.log('Done.');
  await closeKnex();
}
