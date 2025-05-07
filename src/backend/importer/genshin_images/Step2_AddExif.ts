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
  const paths: string[] = [];

  for (let myPath of walkSync(IN_OUT_DIR)) {
    if (!myPath.endsWith('.png') || !myPath.includes('#')) {
      continue;
    }
    paths.push(myPath);
  }

  let i = 1;
  console.log(`${i} / ${paths.length} (${((i / paths.length) * 100).toFixed(2)})`);

  for (let myPath of paths) {
    if (i % 500 === 0) {
      console.log(`${i} / ${paths.length} (${((i / paths.length) * 100).toFixed(2)})`);
    }
    const containerDiscriminator = myPath.split('#')[1].slice(0, -4);

    const buffer = await sharp(myPath).withExifMerge({
      IFD0: {
        Model: containerDiscriminator,
      }
    }).toBuffer();
    fs.writeFileSync(myPath, buffer);
    i++;
  }

  console.log(`${i} / ${paths.length} (${((i / paths.length) * 100).toFixed(2)})`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await doIt();
}
