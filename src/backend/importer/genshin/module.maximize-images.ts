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

    let largestFileNewName = largestFile;

    if (largestFileNewName.includes('#')) {
      largestFileNewName = largestFileNewName.replace(/\s*#\d+\.png$/, '.png');
    }
    if (/\s+\.png/.test(largestFileNewName)) {
      largestFileNewName = largestFileNewName.replace(/\s+\.png/, '.png');
    }

    if (largestFile !== largestFileNewName) {
      fs.renameSync(largestFile, largestFileNewName);
    }

    affected++;
  }

  for (let fileName of fs.readdirSync(IMAGEDIR_GENSHIN_EXT)) {
    let imageName: string;

    if (fileName.includes('#')) {
      imageName = fileName.split('#')[0].trim();
    } else {
      imageName = fileName.split('.png')[0].trim();
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


  let extraneousSpaces = 0;
  for (let fileName of fs.readdirSync(IMAGEDIR_GENSHIN_EXT)) {
    if (/\s+\.png/.test(fileName)) {
      let newFileName = fileName.replace(/\s+\.png/, '.png');

      const absPath1 = path.join(IMAGEDIR_GENSHIN_EXT, fileName);
      const absPath2 = path.join(IMAGEDIR_GENSHIN_EXT, newFileName);
      fs.renameSync(absPath1, absPath2);
      extraneousSpaces++;
    }
  }

  console.log('Done. Affected ' + affected + ' entries.');

  if (extraneousSpaces > 0) {
    console.log('Removed extraneous trailing spaces on ' + extraneousSpaces + ' entries.');
  }
}
