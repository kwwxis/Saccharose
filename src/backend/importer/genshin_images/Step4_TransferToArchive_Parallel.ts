import { fileURLToPath, pathToFileURL } from 'url';
import fs from "fs";
import path from "path";
import sharp from "sharp";
import os from "os";
import { Worker, isMainThread, parentPort } from "worker_threads";
import { fsWalkSync } from '../../util/fsutil.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const combinedDir = "E:/HoYoAssets/GenshinAssets/Texture2D/";
const sourceDir = "C:/HoyoTools/AnimeStudio/GI_OutputFiles";
const targetDir = "E:/HoYoAssets/GenshinAssets/Texture2D_Archive/Texture2D_6.2";
const NUM_WORKERS = Math.max(1, os.cpus().length - 1);

sharp.cache(false);

async function runMain() {
  const files: string[] = [];
  for (let file of fsWalkSync(sourceDir)) {
    files.push(file.replace(/\\/g, "/"));
  }

  const total = files.length;
  let completed = 0;
  console.log(`Found ${total} files. Using ${NUM_WORKERS} workers.`);

  const queue = [...files];

  function dispatchTask(worker: Worker) {
    const task = queue.pop();
    if (task) {
      worker.postMessage({ file: task });
    } else {
      worker.postMessage({ exit: true });
    }
  }

  const workers: Worker[] = [];
  for (let i = 0; i < NUM_WORKERS; i++) {
    const worker = new Worker(__filename, {
      workerData: null,
      execArgv: process.execArgv, // inherit same TS/JS flags
    });

    worker.on("message", (msg: { done?: string; error?: string }) => {
      if (msg.done) {
        completed++;
        if (completed % 100 === 0 || completed === total) {
          const pct = ((completed / total) * 100).toFixed(2);
          console.log(`${completed} / ${total} (${pct}%)`);
        }
        dispatchTask(worker);
      } else if (msg.error) {
        console.error("Worker error:", msg.error);
        dispatchTask(worker);
      }
    });

    worker.on("error", (err) => {
      console.error("Worker crashed:", err);
    });

    workers.push(worker);
  }

  // Start working
  for (const worker of workers) {
    dispatchTask(worker);
  }
}

async function runWorker() {
  if (!parentPort) return;

  parentPort.on("message", async (msg: { file?: string; exit?: boolean }) => {
    if (msg.exit) {
      process.exit(0);
    }

    if (msg.file) {
      try {
        const file = msg.file;
        const basename = path.basename(file);

        const existingName = combinedDir + basename;
        const targetName = targetDir + '/' + basename;

        let shouldCopy = false;

        if (!fs.existsSync(existingName)) {
          shouldCopy = true;
        } else {
          const fileSize = fs.statSync(file)?.size || 0;
          const existingSize = fs.statSync(existingName)?.size || 0;
          if (fileSize != existingSize) {
            shouldCopy = true;
          } else {
            const buff1 = await sharp(file).toBuffer();
            const buff2 = await sharp(existingName).toBuffer();
            if (!buff1.equals(buff2)) {
              shouldCopy = true;
            }
          }
        }

        if (shouldCopy) {
          fs.copyFileSync(file, targetName);
        }

        parentPort?.postMessage({ done: file });
      } catch (err: any) {
        parentPort?.postMessage({ error: err.message });
      }
    }
  });
}

if (isMainThread) {
  if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    await runMain();
  }
} else {
  await runWorker();
}
