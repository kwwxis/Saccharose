import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { toInt } from '../../../shared/util/numberUtil.ts';
import { fsWalkSync } from '../../util/fsutil.ts';
import { GenshinContainerDiscriminator } from '../../domain/genshin/misc/giContainerDiscriminator.ts';

// Copies from IN_DIR to OUT_DIR
// IN_DIR is unaffected
const IN_DIR: string  = 'C:/HoyoTools/AnimeStudio/GI_Output/';
const OUT_DIR: string = 'C:/HoyoTools/AnimeStudio/GI_OutputFiles/';

async function doIt() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (let filePath of fsWalkSync(IN_DIR)) {
    const filePathSplit: string[] = filePath.replace(/\\/g, '/').split('/').reverse();

    const baseName: string = filePathSplit[0];
    const containerId: number = toInt(filePathSplit[1]);
    const discriminator: string = GenshinContainerDiscriminator.toDiscriminator(containerId);

    let targetPath = path.resolve(OUT_DIR, './' + baseName.slice(0, -4) + '#' + discriminator + '.png');

    fs.copyFileSync(filePath, targetPath);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await doIt();
}
