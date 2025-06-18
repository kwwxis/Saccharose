import path from 'path';
import { fileURLToPath } from 'url';
import {
  Worker, isMainThread, parentPort, workerData
} from 'worker_threads';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as os from 'os';

const BASE_PATH = 'C:/Shared/git/_ArchiveSrc';
const MAX_CONCURRENT = 4;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!isMainThread) {
  // Worker thread code
  const {
    repoPath, outPath, folder, commit, skipRegex
  }: {
    repoPath: string;
    outPath : string;
    folder  : string;
    commit  : string;
    skipRegex?: string;
  } = workerData;

  const skipRE = skipRegex ? new RegExp(skipRegex) : undefined;
  let wtPath = '';

  const runGit = (args: string[]) => {
    execSync(`git ${args.join(' ')}`, { cwd: repoPath, stdio: 'pipe' });
  };

  const copyDir = async (src: string, dest: string) => {
    await fsp.mkdir(dest, { recursive: true });
    const entries = await fsp.readdir(src, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === '.git') continue;
      const srcP = path.join(src, e.name);
      const rel  = path.relative(src, srcP);
      if (skipRE?.test(rel)) {
        console.log(`[WT] [${folder}] Skipping path due to regex: ${rel}`);
        continue;
      }
      const dstP = path.join(dest, e.name);
      if (e.isDirectory()) {
        await copyDir(srcP, dstP);
      } else if (e.isFile()) {
        await fsp.copyFile(srcP, dstP);
      }
    }
  };

  let isCleaningUp = false;
  const cleanUp = () => {
    if (isCleaningUp) {
      return;
    }
    isCleaningUp = true;
    try {
      if (wtPath) {
        console.log(`[WT] [${folder}] Removing worktree: ${wtPath}`);
        runGit(['worktree', 'remove', '--force', wtPath]);
      }
    } catch {
      // ignore errors on cleanup
    }
  };

  parentPort!.on('message', (msg) => {
    if (msg === 'cancel') {
      console.log(`[WT] [${folder}] Cancel message received. Cleaning up and exiting.`);
      cleanUp();
      process.exit(1);
    }
  });

  (async () => {
    try {
      console.log(`[WT] [${folder}] Adding worktree at commit ${commit}`);
      wtPath = path.join(os.tmpdir(), `wt_${folder}_${Date.now()}`);
      runGit(['worktree', 'add', '--detach', wtPath, commit]);
      console.log(`[WT] [${folder}] Copying files to output directory`);
      fs.rmSync(path.join(outPath, folder), { recursive: true, force: true });
      await copyDir(wtPath, path.join(outPath, folder));
      cleanUp();
      console.log(`[WT] [${folder}] Done.`);
      parentPort!.postMessage({ status: 'done', folder });
      setTimeout(() => {
        process.exit(0);
      }, 500);
    } catch (err: any) {
      cleanUp();
      console.error(`[WT] [${folder}] Error: ${err.message}`);
      parentPort!.postMessage({ status: 'error', folder, message: err.message });
      setTimeout(() => {
        process.exit(1);
      }, 500);
    }
  })();

} else {
  // Main thread code
  (async () => {
    const args = process.argv.slice(2);
    const repoName = args[0];
    const skipRegexArg = args[1];

    if (!repoName) {
      console.error('[MT] Usage: node extract-commits.js <repoName> [skipRegex]');
      process.exit(1);
    }

    const repoPath = path.join(BASE_PATH, repoName);
    const jsonPath = path.join(BASE_PATH, `${repoName}.json`);
    const outPath = path.join(BASE_PATH, `${repoName}_output`);

    if (!fs.existsSync(repoPath)) {
      console.error(`[MT] ❌ Repo folder not found: ${repoPath}`);
      process.exit(1);
    }

    if (!fs.existsSync(jsonPath)) {
      console.error(`[MT] ❌ JSON file not found: ${jsonPath}`);
      process.exit(1);
    }

    await fsp.mkdir(outPath, { recursive: true });

    let shuttingDown = false;
    const activeWorkers = new Set<Worker>();

    const stopEverything = () => {
      if (shuttingDown) {
        console.log('[MT] Already shutting down...');
        return;
      }
      shuttingDown = true;
      console.log('\n[MT] 🛑 Ctrl+C received. Stopping all workers...');
      for (const w of activeWorkers) {
        w.postMessage('cancel');
      }
      setTimeout(() => {
        for (const w of activeWorkers) {
          w.terminate();
        }
        console.log('[MT] 🛑 Workers terminated. Exiting.');
        process.exit(1);
      }, 2000);
    };

    process.on('SIGINT', stopEverything);
    process.on('SIGTERM', stopEverything);

    const tuples: [string, string][] = JSON.parse(await fsp.readFile(jsonPath, 'utf8'));

    console.log(`[MT] Starting processing ${tuples.length} tuples with max concurrency ${MAX_CONCURRENT}`);
    let idx = 0;
    let finished = 0;

    const spawnNext = () => {
      if (shuttingDown) return;
      if (idx >= tuples.length) return;

      const [folder, commit] = tuples[idx++];
      console.log(`[MT] Spawning worker for [${folder}] commit ${commit} (${idx}/${tuples.length})`);

      const worker = new Worker(__filename, {
        workerData: { repoPath, outPath, folder, commit, skipRegex: skipRegexArg },
        execArgv: process.execArgv,
      });

      activeWorkers.add(worker);

      worker.on('message', (msg) => {
        if (msg.status === 'done') {
          console.log(`[MT] ✅ [${msg.folder}] Finished (${finished + 1}/${tuples.length})`);
        } else if (msg.status === 'error') {
          console.error(`[MT] ❗ [${msg.folder}] Error: ${msg.message}`);
        }
      });

      worker.on('exit', () => {
        console.log(`[MT] [${folder}] Worker exited.`)
        activeWorkers.delete(worker);
        finished++;
        if (!shuttingDown && idx < tuples.length) {
          spawnNext();
        } else if (!shuttingDown && finished === tuples.length) {
          console.log('\n[MT] 🏁 All tasks completed.');
          process.exit(0);
        }
      });

      worker.on('error', (err) => {
        console.error(`[MT] Worker error: ${err.message}`);
      });
    };

    for (let i = 0; i < Math.min(MAX_CONCURRENT, tuples.length); i++) {
      spawnNext();
    }
  })().catch((err) => {
    console.error(`[MT] Fatal error: ${err.message}`);
    process.exit(1);
  });
}
