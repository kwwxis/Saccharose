import { resolve } from 'path';
import { readdir } from 'fs/promises';
import { createReadStream, existsSync, unlinkSync, statSync } from 'fs';
import crypto from 'crypto';

const original = 'E:/HoYoAssets/StarRailAssets/Texture2D_1.0';
const target = 'E:/HoYoAssets/StarRailAssets/Texture2D_1.1';

async function* getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

function checksumFile(hashName, path): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(hashName);
    const stream = createReadStream(path);
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

let filesDeleted = 0;
let filesKept = 0;

for await (const f of getFiles(target)) {
  const otherFile = original + f.slice(target.length);
  let didDelete = false;

  if (existsSync(otherFile)) {
    if (statSync(otherFile).size === statSync(f).size) {
      const checkSumOriginal = await checksumFile('md5', otherFile);
      const checkSumNew = await checksumFile('md5', f);

      if (checkSumNew === checkSumOriginal) {
        unlinkSync(f);
        filesDeleted++;
        didDelete = true;
      }
    }
  }

  if (!didDelete) {
    filesKept++;
  }
}

console.log('Deleted ' + filesDeleted + ' files');
console.log('Kept ' + filesKept + ' files');

