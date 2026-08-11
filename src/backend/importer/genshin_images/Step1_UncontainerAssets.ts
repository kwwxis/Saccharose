import { promises as fsp } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { toInt } from '../../../shared/util/numberUtil.ts';
import { fsWalkAsync } from '../../util/fsutil.ts';
import { GenshinContainerDiscriminator } from '../../domain/genshin/misc/giContainerDiscriminator.ts';

// Moves files from IN_DIR to OUT_DIR
const IN_DIR: string  = 'C:/HoyoTools/AnimeStudio/GI_Output/';
const OUT_DIR: string = 'C:/HoyoTools/AnimeStudio/GI_OutputFiles/';

// Simple concurrency limiter so we don't blow past OS file-handle limits
// when firing off thousands of renames at once.
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function doIt() {
  await fsp.mkdir(OUT_DIR, { recursive: true });

  console.log('Scanning for files');
  const filePaths: string[] = [];
  for await (let filePath of fsWalkAsync(IN_DIR)) {
    filePaths.push(filePath);
  }

  const containerDirs: Set<string> = new Set();

  console.log('Renaming and moving files');
  await mapLimit(filePaths, 32, async (filePath) => {
    const filePathSplit: string[] = filePath.replace(/\\/g, '/').split('/').reverse();

    const baseName: string = filePathSplit[0];
    const containerId: number = toInt(filePathSplit[1]);
    const discriminator: string = GenshinContainerDiscriminator.toDiscriminator(containerId);

    let targetPath = path.resolve(OUT_DIR, './' + baseName.slice(0, -4) + '#' + discriminator + '.png');

    await fsp.rename(filePath, targetPath);

    containerDirs.add(path.dirname(filePath));
  });

  console.log('Cleaning up empty container directories');
  await mapLimit(Array.from(containerDirs), 32, async (containerDir) => {
    if ((await fsp.readdir(containerDir)).length === 0) {
      await fsp.rmdir(containerDir);
    }
  });

  console.log('Done');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await doIt();
}
