import fs from 'fs';
import os from 'os';
import path from 'path';
import { isMainThread, parentPort, Worker, workerData } from 'worker_threads';

import { IMAGEDIR_GENSHIN_EXT } from '../../loadenv.ts';
import { closeKnex, openPgSite } from '../../util/db.ts';
import { ImageContainerEntity } from '../../../shared/types/image-index-types.ts';
import { GenshinContainerDiscriminator } from '../../domain/genshin/misc/giContainerDiscriminator.ts';
import { chunkArrayByNumChunks } from '../../../shared/util/arrayUtil.ts';

const IMAGE_NAME_REGEX =
  /^UI_(Achievement|Activity|Animal|Avatar|BattlePass|Beyd|Beyond|Byd|ChapterIcon|CutScene|DungeonPic|ExplorePic|FlycloakIcon|GCG|Gacha|Icon|Item|LoadingPic|Map|Mark|MessageIcon|MiniMap|MonsterIcon|NPC|Pic|PlotCutScene|Quest|ReadPic|Reputation|Reunion|UGC).*/i;

const dbBatchSize = 1000;
const workerMessageBatchSize = 250;
const workerProgressMessageSize = 100;

type WorkerInput = {
  imageNames: string[];
};

type WorkerMessage = {
  type: 'rows';
  rows: ImageContainerEntity[];
}
  | {
  type: 'progress';
  processed: number;
}
  | {
  type: 'done';
  processed: number;
  emitted: number;
};

let activeKnex: ReturnType<typeof openPgSite> | undefined;
let insertQueue: Promise<void> = Promise.resolve();
let pendingDbBatch: ImageContainerEntity[] = [];
let totalInserted = 0;

let totalImagesToProcess = 0;
let totalImagesProcessed = 0;
let lastLoggedPercent = -1;

function logOverallProgress(processedDelta: number) {
  totalImagesProcessed += processedDelta;

  if (!totalImagesToProcess) {
    return;
  }

  const percent = Math.floor(
    (totalImagesProcessed / totalImagesToProcess) * 100,
  );

  if (percent !== lastLoggedPercent) {
    lastLoggedPercent = percent;

    console.log(
      `Overall progress: ${percent}% (${totalImagesProcessed}/${totalImagesToProcess})`,
    );
  }
}

async function runWorker() {
  if (!parentPort) {
    throw new Error('Worker started without parentPort.');
  }

  const { imageNames } = workerData as WorkerInput;

  const rows: ImageContainerEntity[] = [];
  let processed = 0;
  let emitted = 0;
  let progressSinceLastMessage = 0;

  async function flushRows() {
    if (!rows.length) {
      return;
    }

    parentPort!.postMessage({
      type: 'rows',
      rows: rows.splice(0, rows.length),
    } satisfies WorkerMessage);
  }

  function flushProgress() {
    if (!progressSinceLastMessage) {
      return;
    }

    parentPort!.postMessage({
      type: 'progress',
      processed: progressSinceLastMessage,
    } satisfies WorkerMessage);

    progressSinceLastMessage = 0;
  }

  for (const imageName of imageNames) {
    processed++;
    progressSinceLastMessage++;

    const filePath = path.resolve(IMAGEDIR_GENSHIN_EXT, `${imageName}.png`);
    const discriminator =
      await GenshinContainerDiscriminator.getDiscriminatorFromExif(filePath);

    if (discriminator) {
      const containerId =
        GenshinContainerDiscriminator.toContainerId(discriminator);

      rows.push({
        container_id: containerId,
        image_name: imageName,
      });

      emitted++;
    }

    if (rows.length >= workerMessageBatchSize) {
      await flushRows();
    }

    if (progressSinceLastMessage >= workerProgressMessageSize) {
      flushProgress();
    }
  }

  await flushRows();
  flushProgress();

  parentPort.postMessage({
    type: 'done',
    processed,
    emitted,
  } satisfies WorkerMessage);
}

function runWorkerThread(imageNames: string[]): Promise<{
  processed: number;
  emitted: number;
}> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL(import.meta.url), {
      workerData: {
        imageNames,
      } satisfies WorkerInput,
    });

    let donePayload: { processed: number; emitted: number } | undefined;

    worker.on('message', (message: WorkerMessage) => {
      if (message.type === 'rows') {
        void enqueueRows(message.rows);
      } else if (message.type === 'progress') {
        logOverallProgress(message.processed);
      } else if (message.type === 'done') {
        donePayload = {
          processed: message.processed,
          emitted: message.emitted,
        };
      }
    });

    worker.on('error', reject);

    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}.`));
        return;
      }

      resolve(donePayload ?? { processed: 0, emitted: 0 });
    });
  });
}

function enqueueRows(rows: ImageContainerEntity[]) {
  insertQueue = insertQueue.then(async () => {
    pendingDbBatch.push(...rows);

    while (pendingDbBatch.length >= dbBatchSize) {
      const batchToInsert = pendingDbBatch.splice(0, dbBatchSize);
      await commitRows(batchToInsert);
    }
  });

  return insertQueue;
}

async function commitRows(rows: ImageContainerEntity[]) {
  if (!rows.length) {
    return;
  }

  if (!activeKnex) {
    throw new Error('Database connection was not initialized.');
  }

  await activeKnex.transaction(async (tx) => {
    await tx.batchInsert('genshin_image_containers', rows);
  });

  totalInserted += rows.length;
  console.log(`Committed batch (Total inserted ${totalInserted})`);
}

async function flushInsertQueue() {
  await insertQueue;

  if (pendingDbBatch.length) {
    const finalBatch = pendingDbBatch.splice(0, pendingDbBatch.length);
    await commitRows(finalBatch);
  }
}

export async function populateImageContainers() {
  if (!isMainThread) {
    throw new Error(
      'populateImageContainers() must only be called on the main thread.',
    );
  }

  activeKnex = openPgSite();

  try {
    await activeKnex.raw('TRUNCATE TABLE genshin_image_containers;');

    const gatherImageNames: string[] = [];

    for (const fileName of fs.readdirSync(IMAGEDIR_GENSHIN_EXT)) {
      if (!fileName.endsWith('.png')) {
        continue;
      }

      const imageName = fileName.slice(0, -4);

      if (!IMAGE_NAME_REGEX.test(imageName)) {
        continue;
      }

      gatherImageNames.push(imageName);
    }

    console.log(`Image count to process: ${gatherImageNames.length}`);

    totalImagesToProcess = gatherImageNames.length;
    totalImagesProcessed = 0;
    lastLoggedPercent = -1;

    if (!gatherImageNames.length) {
      console.log('Done. No images to process.');
      return;
    }

    const workerCount = Math.min(
      gatherImageNames.length,
      Math.max(1, os.availableParallelism?.() ?? os.cpus().length),
    );

    const chunks = chunkArrayByNumChunks(gatherImageNames, workerCount);

    console.log(`Starting ${chunks.length} worker threads.`);

    const results = await Promise.all(
      chunks.map((chunk) => runWorkerThread(chunk)),
    );

    await flushInsertQueue();

    const totalProcessedByWorkers = results.reduce(
      (sum, result) => sum + result.processed,
      0,
    );

    const totalEmittedByWorkers = results.reduce(
      (sum, result) => sum + result.emitted,
      0,
    );

    console.log(
      `Done. Workers processed ${totalProcessedByWorkers}, emitted ${totalEmittedByWorkers}, inserted ${totalInserted}.`,
    );
  } finally {
    await flushInsertQueue().catch((err) => {
      console.error('Failed while flushing pending inserts during shutdown:', err);
    });

    await closeKnex();

    activeKnex = undefined;
    insertQueue = Promise.resolve();
    pendingDbBatch = [];
    totalInserted = 0;

    totalImagesToProcess = 0;
    totalImagesProcessed = 0;
    lastLoggedPercent = -1;
  }
}

if (!isMainThread) {
  runWorker().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
