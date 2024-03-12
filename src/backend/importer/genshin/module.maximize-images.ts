import path from 'path';
import { IMAGEDIR_GENSHIN_EXT } from '../../loadenv.ts';
import fs, { promises as fsp } from 'fs';

export async function maximizeImages() {
  let dupeSet: string[] = [];
  let dupeKey: string = null;
  let affected: number = 0;

  async function processDupeSet() {
    let sizes: {[fileName: string]: number} = {};

    await Promise.all(dupeSet.map(f => {
      const absPath = path.join(IMAGEDIR_GENSHIN_EXT, f);
      return fsp.stat(absPath).then(stats => {
        sizes[absPath] = stats.size;
      });
    }));

    let largestFile: string = Object.keys(sizes).find(f => !f.includes('#')); // prefer non-hashtag file first
    let currLargestSize: number = 0;

    for (let [absPath, byteSize] of Object.entries(sizes)) {
      if (byteSize > currLargestSize) {
        largestFile = absPath;
        currLargestSize = byteSize;
      }
    }

    for (let absPath of Object.keys(sizes)) {
      if (absPath !== largestFile) {
        fs.unlinkSync(absPath);
      }
    }

    if (largestFile.includes('#')) {
      let actualFile = largestFile.replace(/\s*#\d+\.png$/, '.png');
      fs.renameSync(largestFile, actualFile);
    }

    affected++;
  }

  for (let fileName of fs.readdirSync(IMAGEDIR_GENSHIN_EXT)) {
    if (/\s+\.png/.test(fileName)) {
      let oldName = fileName;
      fileName = fileName.replace(/\s+\.png/, '.png');
      fs.renameSync(oldName, fileName);
    }

    let imageName: string;

    if (fileName.includes('#')) {
      imageName = fileName.split('#')[0].trim();
    } else {
      imageName = fileName.split('.png')[0];
    }

    if (dupeKey !== imageName) {
      dupeKey = imageName;
      if (dupeSet.length > 1) {
        await processDupeSet();
      }
      dupeSet = [];
    }

    dupeSet.push(fileName);
  }

  console.log('Done. Affected ' + affected + ' entries.');
}
