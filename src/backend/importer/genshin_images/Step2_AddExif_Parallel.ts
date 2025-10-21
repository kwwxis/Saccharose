import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from 'url';
import os from "os";
import sharp from "sharp";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { fsWalkSync } from '../../util/fsutil.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IN_OUT_DIR: string = "C:/HoyoTools/AnimeStudio/GI_OutputFiles/";
const NUM_WORKERS = Math.max(1, os.cpus().length - 1);

sharp.cache(false);

async function runMain() {
  const paths: string[] = [];
  for (let myPath of fsWalkSync(IN_OUT_DIR)) {
    if (!myPath.endsWith(".png") || !myPath.includes("#")) continue;
    paths.push(myPath);
  }

  const total = paths.length;
  let completed = 0;
  console.log(`Found ${total} PNG files. Using ${NUM_WORKERS} workers.`);

  const queue = [...paths];
  const workers: Worker[] = [];

  function dispatchTask(worker: Worker) {
    const task = queue.pop();
    if (task) {
      worker.postMessage({ path: task });
    } else {
      worker.postMessage({ exit: true });
    }
  }

  for (let i = 0; i < NUM_WORKERS; i++) {
    const worker = new Worker(__filename, {
      workerData: null,
      execArgv: process.execArgv,
    });

    worker.on("message", (msg: { done?: string; error?: string }) => {
      if (msg.done) {
        completed++;
        if (completed % 500 === 0 || completed === total) {
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
  parentPort.on("message", async (msg: { path?: string; exit?: boolean }) => {
    if (msg.exit) {
      process.exit(0);
    }
    if (msg.path) {
      try {
        const myPath = msg.path;
        const containerDiscriminator = myPath.split("#")[1].slice(0, -4);

        const buffer = await sharp(myPath)
          .withExifMerge({
            IFD0: {
              Model: containerDiscriminator,
            },
          })
          .toBuffer();

        fs.writeFileSync(myPath, buffer);

        parentPort?.postMessage({ done: myPath });
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
