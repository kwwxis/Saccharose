import { pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fsWalkSync } from '../../util/fsutil.ts';

async function doIt() {
  const combinedDir: string = 'E:/HoYoAssets/GenshinAssets/Texture2D/';
  const sourceDir: string = 'C:/HoyoTools/AnimeStudio/GI_OutputFiles';
  const targetDir: string = "E:/HoYoAssets/GenshinAssets/Texture2D_Archive/Texture2D_6.2";

  const files: string[] = [];
  for (let file of fsWalkSync(sourceDir)) {
    file = file.replace(/\\/g, '/');
    files.push(file);
  }

  const filesAmount = files.length;

  let i = 0;
  for (const file of files) {
    const basename = path.basename(file);

    if (i % 100 === 0) {
      console.log(`${i} / ${filesAmount} (${((i / filesAmount) * 100).toFixed(2)})`);
    }

    const existingName = combinedDir + basename;
    const targetName = targetDir + '/' + basename;

    let shouldCopy = false;

    if (!fs.existsSync(existingName)) {
      shouldCopy = true;
    } else {
      const fileSize = fs.statSync(file)?.size || 0;
      const existingSize = fs.statSync(existingName)?.size || 0;
      if (fileSize != existingSize) {
        shouldCopy = true;
      } else {
        const buff1 = await sharp(file).toBuffer();
        const buff2 = await sharp(existingName).toBuffer();
        if (!buff1.equals(buff2)) {
          shouldCopy = true;
        }
      }
    }

    if (shouldCopy) {
      fs.copyFileSync(file, targetName);
    }
    i++;
  }

  console.log(`${i} / ${filesAmount} (${((i / filesAmount) * 100).toFixed(2)})`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await doIt();
}
