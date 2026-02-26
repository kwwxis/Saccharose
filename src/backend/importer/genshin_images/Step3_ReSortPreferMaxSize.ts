import fs from 'fs';
import { pathToFileURL } from 'url';
import sharp from 'sharp';
import exifReader from 'exif-reader';
import { fsWalkSync } from '../../util/fsutil.ts';
import { GenshinContainerDiscriminator } from '../../domain/genshin/misc/giContainerDiscriminator.ts';

// Runs in-place on the same directory:
const IN_OUT_DIR: string = 'C:/HoyoTools/AnimeStudio/GI_OutputFiles';

async function doIt() {
  let renameCount = 0;

  for (let myPath of fsWalkSync(IN_OUT_DIR)) {
    if (!myPath.includes('#')) {
      continue;
    }

    const basePath = myPath.split('#')[0] + '.png';
    const mySize: number = fs.statSync(myPath).size;

    if (fs.existsSync(basePath)) {
      const baseSize: number = fs.statSync(basePath).size;

      if (mySize > baseSize) {
        const basePathDiscriminator = await GenshinContainerDiscriminator.getDiscriminatorFromExif(basePath);
        fs.renameSync(basePath, basePath.slice(0, -4) + '#' + basePathDiscriminator + '.png');
        fs.renameSync(myPath, basePath);
        renameCount++;
      }
    } else {
      fs.renameSync(myPath, basePath);
      renameCount++;
    }
  }

  console.log('RenameCount:', renameCount);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await doIt();
}
