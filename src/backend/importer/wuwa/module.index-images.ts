import path from 'path';
import { IMAGEDIR_WUWA_EXT } from '../../loadenv.ts';
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
import { fsWalkSync } from '../../util/fsutil.ts';

function getImageNames(): string[] {
  const imageNames: string[] = [];
  for (let fileName of fsWalkSync(IMAGEDIR_WUWA_EXT)) {
    fileName = path.relative(IMAGEDIR_WUWA_EXT, fileName).replace(/\\/g, '/');
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

export async function indexWuwaImages(catMapOnly: boolean = false) {
  const knex = openPgSite();

  if (!catMapOnly) {
    await knex.raw('TRUNCATE TABLE wuwa_image_index;').then();
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

          if (obj.startsWith('[') || obj.startsWith('{'))
            continue;
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
  for (let fileName of fs.readdirSync(path.resolve(ENV.WUWA_DATA_ROOT, './ConfigDB'))) {
    console.log(`  ${fileName}`);
    const json: any[] = JSON.parse(fs.readFileSync(path.resolve(ENV.WUWA_DATA_ROOT, './ConfigDB', fileName), 'utf-8'));
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
        return knex.batchInsert('wuwa_image_index', batch).transacting(tx);
      }).then();
    }
    batch.length = 0;
    console.log('Committed batch');
  }

  console.log('Committing...');
  for (let imageName of getImageNames()) {
    const cats: Record<string, string> = {};
    const orderedCats: string[] = [];
    const imageNameParts = imageName.split('/');
    for (let i = 0; i < imageNameParts.length; i++) {
      const part = imageNameParts[i];
      if (i == imageNameParts.length - 1) {
        // Don't include last part (the image name) as part of the categories (directories)
        break;
      }
      cats[`cat${i}`] = part;
      orderedCats.push(part);
    }

    if (!catMapOnly) {
      const filePath: string = path.resolve(IMAGEDIR_WUWA_EXT, `./${imageName}.png`);
      const byteSize: number = fs.statSync(filePath)?.size || 0;
      const imageSize: ISizeCalculationResult = await imageSizeFromFile(filePath);
      batch.push({
        image_name: imageName,
        image_size: byteSize,
        image_width: imageSize.width,
        image_height: imageSize.height,
        excel_usages: imageNameToExcelFileUsages[imageName] || [],
        excel_meta: imageNameToExcelMeta[imageName] || {},
        image_cats: cats,
      });
    }

    let currCat = catmap;
    for (let cat of orderedCats) {
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
    path.resolve(ENV.WUWA_DATA_ROOT, './ImageIndexCategoryMap.json'),
    JSON.stringify(catmap, null, 2),
    'utf-8'
  );

  console.log('Done.');
  await closeKnex();
}
