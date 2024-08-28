import { pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';

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

async function doIt() {
  const targetDir: string = "E:\\HoYoAssets\\GenshinAssets\\Sprite_Archive\\Sprite_4.8_2";

  const files: string[] = [];
  for (let file of walkSync('E:\\HoYoAssets\\GenshinAssets\\Sprite_Archive\\Sprite_4.8')) {
    file = file.replace(/\\/g, '/');
    files.push(file);
  }

  const filesAmount = files.length;

  let i = 0;
  for (const file of files) {
    const basename = path.basename(file);

    if (i % 100 === 0) {
      console.log(`${i} / ${filesAmount}`);
    }

    const existingName = 'E:/HoYoAssets/GenshinAssets/Sprite/' + basename;
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
        const buff1 = fs.readFileSync(file);
        const buff2 = fs.readFileSync(existingName);
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
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await doIt();
}
