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

const OUT_DIR: string = 'C:/Shared/Texture2D_ByFileName';

async function doIt() {
  let octoCount = 0;
  let renameCount = 0;

  for (let myPath of walkSync(OUT_DIR)) {
    if (!/#\d+\.png/.test(myPath)) {
      continue;
    }
    octoCount++;

    let basePath = myPath.split('#')[0] + '.png';

    const mySize: number = fs.statSync(myPath).size;
    const baseSize: number = fs.statSync(basePath).size;

    if (mySize > baseSize) {
      fs.renameSync(basePath, basePath.slice(0, -4) + '#' + baseSize + '.png');
      fs.renameSync(myPath, basePath);
      renameCount++;
    }
  }

  console.log('OctoCount:', octoCount);
  console.log('RenameCount:', renameCount);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await doIt();
}
