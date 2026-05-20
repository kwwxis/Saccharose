import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fsWalkSync } from '../../util/fsutil.ts';

const combinedDir = 'E:/GameDataAssets/GenshinAssets/Texture2D/';
const targetDir = 'E:/GameDataAssets/GenshinAssets/Texture2D_Archive/Texture2D_6.5';

const autoKeepThreshold = new Date('2026-05-07T11:39:52.000Z');

const __filename = fileURLToPath(import.meta.url);

function chunkArray(array, chunkCount) {
  const chunks = Array.from({ length: chunkCount }, () => []);

  for (let i = 0; i < array.length; i++) {
    chunks[i % chunkCount].push(array[i]);
  }

  return chunks.filter(chunk => chunk.length > 0);
}

if (isMainThread) {
  const files = Array.from(fsWalkSync(targetDir)).map(file =>
    file.replace(/\\/g, '/')
  );

  const workerCount = Math.min(os.cpus().length, files.length || 1);
  const chunks = chunkArray(files, workerCount);

  let completed = 0;
  let failed = false;

  for (const chunk of chunks) {
    const worker = new Worker(__filename, {
      workerData: {
        files: chunk,
        combinedDir,
        autoKeepThreshold: autoKeepThreshold.toISOString(),
      },
    });

    worker.on('message', message => {
      if (message.type === 'log') {
        console.log(...message.args);
      }
    });

    worker.on('error', error => {
      failed = true;
      console.error('Worker failed:', error);
    });

    worker.on('exit', code => {
      completed++;

      if (code !== 0) {
        failed = true;
        console.error(`Worker exited with code ${code}`);
      }

      if (completed === chunks.length) {
        process.exitCode = failed ? 1 : 0;
      }
    });
  }
} else {
  const {
    files,
    combinedDir,
    autoKeepThreshold,
  } = workerData;

  const threshold = new Date(autoKeepThreshold);

  for (const file of files) {
    try {
      const baseName = path.basename(file);
      const sourceFile = path.join(combinedDir, baseName);

      const stat = fs.statSync(file);

      if (stat.mtime < threshold) {
        continue;
      }

      if (fs.existsSync(sourceFile)) {
        parentPort.postMessage({
          type: 'log',
          args: [baseName, stat.mtime, 'existing'],
        });

        fs.unlinkSync(file);
        fs.copyFileSync(sourceFile, file);
      } else {
        parentPort.postMessage({
          type: 'log',
          args: [baseName, stat.mtime, 'new'],
        });

        fs.unlinkSync(file);
      }
    } catch (error: any) {
      parentPort.postMessage({
        type: 'log',
        args: [`Failed processing ${file}:`, error?.message],
      });
    }
  }
}
