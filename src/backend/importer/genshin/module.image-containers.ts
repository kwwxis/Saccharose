import fs from 'fs';
import { IMAGEDIR_GENSHIN_EXT } from '../../loadenv.ts';
import { closeKnex, openPgSite } from '../../util/db.ts';
import { ImageContainerEntity, ImageIndexEntity } from '../../../shared/types/image-index-types.ts';
import path from 'path';
import { GenshinContainerDiscriminator } from '../../domain/genshin/misc/giContainerDiscriminator.ts';

export async function populateImageContainers() {
  const knex = openPgSite();

  await knex.raw('TRUNCATE TABLE genshin_image_containers;').then();

  const batch: ImageContainerEntity[] = [];
  const maxBatchSize: number = 1000;
  let totalProcessed = 0;

  async function commitBatch() {
    totalProcessed += batch.length;
    await knex.transaction(function(tx) {
      return knex.batchInsert('genshin_image_containers', batch).transacting(tx);
    }).then();
    batch.length = 0;
    console.log(`Committed batch (Total processed ${totalProcessed})`);
  }

  const gatherImageNames: string[] = [];

  for (const fileName of fs.readdirSync(IMAGEDIR_GENSHIN_EXT)) {
    if (!fileName.endsWith('.png')) {
      continue;
    }

    const imageName: string = fileName.slice(0, -4); // Remove ".png" suffix

    if (!/^UI_(Achievement|Activity|Animal|Avatar|BattlePass|Beyd|Beyond|Byd|ChapterIcon|CutScene|DungeonPic|ExplorePic|FlycloakIcon|GCG|Gacha|Icon|Item|LoadingPic|Map|Mark|MessageIcon|MiniMap|MonsterIcon|NPC|Pic|PlotCutScene|Quest|ReadPic|Reputation|Reunion|UGC).*/i.test(imageName)) {
      continue;
    }

    gatherImageNames.push(imageName);
  }

  console.log(`Image count to process: ${gatherImageNames.length}`);

  for (let imageName of gatherImageNames) {
    const filePath: string = path.resolve(IMAGEDIR_GENSHIN_EXT, `./${imageName}.png`);
    const discriminator: string = await GenshinContainerDiscriminator.getDiscriminatorFromExif(filePath);
    if (!discriminator) {
      continue;
    }

    const containerId: number = GenshinContainerDiscriminator.toContainerId(discriminator);

    batch.push({
      container_id: containerId,
      image_name: imageName,
    });

    if (batch.length >= maxBatchSize) {
      await commitBatch();
    }
  }

  if (batch.length) {
    await commitBatch();
  }

  console.log('Done.');
  await closeKnex();
}
