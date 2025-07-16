import path from 'path';
import { IMAGEDIR_GENSHIN_EXT } from '../../loadenv.ts';
import fs from 'fs';
import { closeKnex, openPgSite } from '../../util/db.ts';
import { isInt } from '../../../shared/util/numberUtil.ts';
import { defaultMap } from '../../../shared/util/genericUtil.ts';
import {
  ImageCategoryMap,
  ImageIndexEntity,
  ImageIndexExcelMeta,
  ImageIndexExcelMetaEntry, ImageIndexOtherName, newImageCategory,
} from '../../../shared/types/image-index-types.ts';
import { imageSizeFromFile, ISizeCalculationResult } from '../../util/image-size';

const otherNames: Record<string, ImageIndexOtherName[]> = defaultMap('Array');

function getImageNames(): string[] {
  console.log('Gathering image names...');
  const imageNames: string[] = [];
  for (const fileName of fs.readdirSync(IMAGEDIR_GENSHIN_EXT)) {
    if (!fileName.endsWith('.png')) {
      continue;
    }

    const imageName: string = fileName.slice(0, -4); // Remove ".png" suffix
    if (imageName.includes('#')) {
      const imageBaseName = imageName.split('#')[0];
      const size: number = fs.statSync(path.resolve(IMAGEDIR_GENSHIN_EXT, `./${imageName}.png`))?.size || 0;

      if (!otherNames[imageBaseName].some(x => x.name === imageName)) {
        otherNames[imageBaseName].push({
          name: imageName,
          size,
        });
      }

      continue;
    }
    imageNames.push(imageName);
  }
  console.log('  Image Names Count:', imageNames.length);
  return imageNames;
}

export async function indexGenshinImages(catMapOnly: boolean = false) {
  const knex = openPgSite();

  if (!catMapOnly) {
    await knex.raw('TRUNCATE TABLE genshin_image_index;').then();
  }

  const imageNameSet: Set<string> = new Set();
  const imageNameToExcelFileUsages: Record<string, string[]> = defaultMap('Array');
  const imageNameToExcelMeta: Record<string, ImageIndexExcelMeta> = defaultMap('Object');

  const catmap: ImageCategoryMap = newImageCategory('root');

  for (let imageName of getImageNames()) {
    imageNameSet.add(imageName);
  }

  const firstVersionMap = JSON.parse(fs.readFileSync(
    path.resolve(ENV.GENSHIN_DATA_ROOT, './NewImages.json'),
    {encoding: 'utf8'}
  ));

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
          if (imageNameSet.has(obj)) {
            matchedImageName = obj;
          } else if (obj.startsWith('ART/')) {
            const objBaseName = path.basename(obj);
            if (imageNameSet.has(objBaseName)) {
              matchedImageName = objBaseName;
            }
          }
          if (matchedImageName) {
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
  for (let fileName of fs.readdirSync(path.resolve(ENV.GENSHIN_DATA_ROOT, './ExcelBinOutput'))) {
    const json: any[] = JSON.parse(fs.readFileSync(path.resolve(ENV.GENSHIN_DATA_ROOT, './ExcelBinOutput', fileName), 'utf-8'));
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
        return knex.batchInsert('genshin_image_index', batch).transacting(tx);
      }).then();
    }
    batch.length = 0;
    console.log('Committed batch');
  }

  console.log('Committing...');
  for (let imageName of imageNameSet) {
    const cats: string[] = [];
    let catIdx = 0;
    let catSplits = imageName.split('_');
    for (let i = 0; i < catSplits.length; i++) {
      let cat = catSplits[i];
      if (isInt(cat)) {
        break;
      }
      if (i == catSplits.length - 1) {
        if (cat.startsWith('EmotionIcon')) {
          cats[catIdx] = 'EmotionIcon';
        }
        break;
      }
      cats[catIdx] = cat;
      catIdx++;
    }

    const firstVersion = firstVersionMap[imageName];

    if (!catMapOnly) {
      const filePath: string = path.resolve(IMAGEDIR_GENSHIN_EXT, `./${imageName}.png`);
      const size: number = fs.statSync(filePath)?.size || 0;
      const imageSize: ISizeCalculationResult = await imageSizeFromFile(filePath);
      batch.push({
        image_name: imageName,
        image_size: size,
        image_width: imageSize.width,
        image_height: imageSize.height,
        excel_usages: imageNameToExcelFileUsages[imageName] || [],
        excel_meta: imageNameToExcelMeta[imageName] || {},
        image_cat1: cats[0] || null,
        image_cat2: cats[1] || null,
        image_cat3: cats[2] || null,
        image_cat4: cats[3] || null,
        image_cat5: cats[4] || null,
        first_version: firstVersion,
        extra_info: {
          otherNames: otherNames[imageName] || []
        }
      });
    }

    let currCat = catmap;
    if (!!firstVersion && !currCat.newImageVersions.includes(firstVersion))
      currCat.newImageVersions.push(firstVersion);

    for (let cat of cats) {
      currCat = currCat.children[cat];
      if (!!firstVersion && !currCat.newImageVersions.includes(firstVersion))
        currCat.newImageVersions.push(firstVersion);
    }

    if (!catMapOnly && batch.length >= maxBatchSize) {
      await commitBatch();
    }
  }

  if (!catMapOnly) {
    await commitBatch();
  }

  fs.writeFileSync(
    path.resolve(ENV.GENSHIN_DATA_ROOT, './ImageIndexCategoryMap.json'),
    JSON.stringify(catmap, null, 2),
    'utf-8'
  );

  console.log('Done.');
  await closeKnex();
}
