import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import sharp from 'sharp';

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
const IN_OUT_DIR: string = 'C:/Shared/HoyoStudioYarik/Output_Texture2D_Files/';

sharp.cache(false);

async function doIt() {
  for (let myPath of walkSync(IN_OUT_DIR)) {
    if (!myPath.endsWith('.png') || !myPath.includes('#')) {
      continue;
    }

    const containerDiscriminator = myPath.split('#')[1].slice(0, -4);

    const buffer = await sharp(myPath).withExifMerge({
      IFD0: {
        Model: containerDiscriminator,
      }
    }).toBuffer();
    fs.writeFileSync(myPath, buffer);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await doIt();
}
