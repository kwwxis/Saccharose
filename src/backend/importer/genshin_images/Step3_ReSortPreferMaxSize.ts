import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import sharp from 'sharp';
import exifReader from 'exif-reader';

function* walkSync(dir: string): Generator<string> {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}

// Runs in-place on the same directory:
const IN_OUT_DIR: string = 'C:/Shared/AnimeStudio/Output_Texture2D_Files';

async function getDiscriminator(myPath: string) {
  const exifBuf = (await sharp(myPath).metadata()).exif;
  const exifData = exifBuf ? exifReader(exifBuf) : null;
  const containerDiscriminator: string = exifData?.Image?.Model;
  return containerDiscriminator;
}

async function doIt() {
  let renameCount = 0;

  for (let myPath of walkSync(IN_OUT_DIR)) {
    if (!myPath.includes('#')) {
      continue;
    }

    const basePath = myPath.split('#')[0] + '.png';
    const mySize: number = fs.statSync(myPath).size;

    if (fs.existsSync(basePath)) {
      const baseSize: number = fs.statSync(basePath).size;

      if (mySize > baseSize) {
        const basePathDiscriminator = await getDiscriminator(basePath);
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
