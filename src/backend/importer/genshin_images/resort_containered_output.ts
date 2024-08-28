import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

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

const OUT_DIR: string = 'C:/Shared/Texture2D_ByFileName'

async function doIt() {
  for (let filePath of walkSync('C:/Shared/Texture2D_ByContainer/')) {
    const baseName = path.basename(filePath);
    let targetPath = OUT_DIR + '/' + baseName;

    if (fs.existsSync(targetPath)) {
      let fileSize: number = fs.statSync(filePath).size;
      targetPath = targetPath.slice(0, -4) + '#' + fileSize + '.png';
    }

    fs.copyFileSync(filePath, targetPath);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await doIt();
}
