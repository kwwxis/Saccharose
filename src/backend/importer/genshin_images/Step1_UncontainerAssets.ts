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

// Copies from IN_DIR to OUT_DIR
// IN_DIR is unaffected
const IN_DIR: string  = 'C:/Shared/HoyoStudioYarik/Output_Texture2D/';
const OUT_DIR: string = 'C:/Shared/HoyoStudioYarik/Output_Texture2D_Files/';

async function doIt() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (let filePath of walkSync(IN_DIR)) {
    const filePathSplit: string[] = filePath.replace(/\\/g, '/').split('/').reverse();

    const baseName: string = filePathSplit[0];
    const containerId: number = parseInt(filePathSplit[1]);
    const isNegative: boolean = containerId < 0;

    const discriminator: string = (isNegative ? 'n' : '') + Math.abs(containerId).toString(16);

    let targetPath = path.resolve(OUT_DIR, './' + baseName.slice(0, -4) + '#' + discriminator + '.png');

    fs.copyFileSync(filePath, targetPath);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await doIt();
}
