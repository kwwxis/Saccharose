import { AbstractControl } from '../../domain/abstract/abstractControl.ts';
import fs, { promises as fsp } from 'fs';
import { LANG_CODES, LangCode } from '../../../shared/types/lang-types.ts';
import { getTextMapRelPath } from '../../loadenv.ts';
import chalk from 'chalk';
import { EM_DASH, EN_DASH, NormTextOptions } from '../../domain/abstract/genericNormalizers.ts';
import os from 'os';
import { isMainThread, parentPort, Worker } from 'worker_threads';
import { SiteMode } from '../../../shared/types/site/site-mode-type.ts';
import { ControlUserMode } from '../../domain/abstract/abstractControlState.ts';
import { GenshinControl, GenshinControlState } from '../../domain/genshin/genshinControl.ts';
import { StarRailControl, StarRailControlState } from '../../domain/hsr/starRailControl.ts';
import { ZenlessControl, ZenlessControlState } from '../../domain/zenless/zenlessControl.ts';
import { WuwaControl, WuwaControlState } from '../../domain/wuwa/wuwaControl.ts';

// region Worker Pool
// --------------------------------------------------------------------------------------------------------------
// Each language's PlainTextMap generation is independent of every other language's, so the per-language work
// (the bottleneck of this module) is farmed out to a pool of worker threads - one language at a time per worker.
type WorkerTask = {
  langCode: LangCode;
  siteMode: SiteMode;
  controlUserMode: ControlUserMode;
  textMapPath: string;
  outTextPath: string;
  outHashPath: string;
};

type WorkerRequest =
  | { task: WorkerTask }
  | { exit: true };

type WorkerResponse =
  | { langCode: LangCode; ok: true }
  | { langCode: LangCode; ok: false; textMapPath: string; error: string };

/**
 * Builds a database-less control instance for the given site mode, carrying over the original control's
 * user mode (lang codes/search mode/prefs) so that `normText(...)` behaves identically to how it would've
 * behaved on the original `ctrl` passed into `importPlainTextMap`.
 */
function createNoDbControl(siteMode: SiteMode, controlUserMode: ControlUserMode): AbstractControl {
  switch (siteMode) {
    case 'genshin': {
      const state = new GenshinControlState(controlUserMode);
      state.DbConnection = false;
      return new GenshinControl(state);
    }
    case 'hsr': {
      const state = new StarRailControlState(controlUserMode);
      state.DbConnection = false;
      return new StarRailControl(state);
    }
    case 'zenless': {
      const state = new ZenlessControlState(controlUserMode);
      state.DbConnection = false;
      return new ZenlessControl(state);
    }
    case 'wuwa': {
      const state = new WuwaControlState(controlUserMode);
      state.DbConnection = false;
      return new WuwaControl(state);
    }
    default:
      throw new Error('Unsupported site mode for PlainTextMap worker: ' + siteMode);
  }
}

function runPlainTextMapTasksInWorkerPool(tasks: WorkerTask[]): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!tasks.length) {
      resolve();
      return;
    }

    const numWorkers = Math.max(1, Math.min(os.cpus().length - 1, tasks.length));

    let dispatchIndex = 0;
    let completed = 0;
    let settled = false;

    const workers: Worker[] = [];

    function fail(err: Error) {
      if (settled) return;
      settled = true;
      for (const w of workers) {
        void w.terminate();
      }
      reject(err);
    }

    function dispatchNext(worker: Worker) {
      if (dispatchIndex >= tasks.length) {
        const req: WorkerRequest = { exit: true };
        worker.postMessage(req);
        return;
      }
      const task = tasks[dispatchIndex++];
      const req: WorkerRequest = { task };
      worker.postMessage(req);
    }

    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(new URL(import.meta.url), {
        execArgv: process.execArgv,
      });

      worker.on('message', (msg: WorkerResponse) => {
        if (msg.ok === false) { // have to use `msg.ok === false` instead of `!msg.ok` because TypeScript doesn't narrow the type correctly
          console.log(chalk.yellow('Could not process TextMap for ' + msg.langCode + ' (may not exist) -- ' + msg.textMapPath));
          if (!msg.error.includes('no such file or directory')) {
            console.error(msg.error);
          }
        }
        console.log(chalk.gray('----------'));

        completed++;
        if (completed === tasks.length) {
          for (const w of workers) {
            const req: WorkerRequest = { exit: true };
            w.postMessage(req);
          }
        }
        dispatchNext(worker);
      });

      worker.on('error', (err) => fail(err));

      workers.push(worker);
    }

    let exitedCount = 0;
    for (const worker of workers) {
      worker.on('exit', () => {
        exitedCount++;
        if (exitedCount === workers.length && !settled) {
          settled = true;
          resolve();
        }
      });
    }

    for (const worker of workers) {
      dispatchNext(worker);
    }
  });
}

if (!isMainThread) {
  parentPort?.on('message', async (msg: WorkerRequest) => {
    if ('exit' in msg) {
      process.exit(0);
    }

    const { langCode, siteMode, controlUserMode, textMapPath, outTextPath, outHashPath } = msg.task;
    try {
      const ctrl = createNoDbControl(siteMode, controlUserMode);

      let textmap: { [hash: string]: string } = await fsp.readFile(textMapPath, { encoding: 'utf8' }).then(data => {
        return Object.freeze(JSON.parse(data));
      });

      console.log(chalk.bold.underline('Creating PlainTextMap for ' + langCode));
      let hashList: string[] = []; // entry format: "<hash>" or "<hash>,<type>"
      let textList: string[] = [];

      for (let [hash, text] of Object.entries(textmap)) {
        hash = hash.replaceAll(/\r?\n/g, '');

        hashList.push(hash + ',raw');
        textList.push(text.replaceAll(/\r?\n/g, '\\n'));

        let variations: NormTextOptions[] = [
          { decolor: true, plaintext: true, plaintextMcMode: 'both' },
        ];

        if (text.includes('{F#') || text.includes('{M#')) {
          variations.push({ decolor: true, plaintext: true, plaintextMcMode: 'male' });
          variations.push({ decolor: true, plaintext: true, plaintextMcMode: 'female' });
        }

        const addSingleVariation = (variation: NormTextOptions) => {
          variations.push(...variations.map(v => Object.assign({}, v, variation)));
        };

        if (text.includes(EM_DASH) || text.includes(EN_DASH)) {
          addSingleVariation({ forceFancyDash: true });
        }

        for (let variation of variations) {
          hashList.push(hash);
          textList.push(ctrl.normText(text, langCode, variation).replaceAll(/\r?\n/g, '\\n'));
        }
      }

      console.log(`  Writing to ${outTextPath}`);
      fs.writeFileSync(outTextPath, textList.join('\n'), 'utf8');
      console.log(`  Writing to ${outHashPath}`);
      fs.writeFileSync(outHashPath, hashList.join('\n'), 'utf8');

      textmap = null;

      const res: WorkerResponse = { langCode, ok: true };
      parentPort?.postMessage(res);
    } catch (err: any) {
      const res: WorkerResponse = { langCode, ok: false, textMapPath, error: err?.stack || err?.message || String(err) };
      parentPort?.postMessage(res);
    }
  });
}
// endregion

export async function importPlainTextMap(ctrl: AbstractControl, getDataFilePath: (relPath: string) => string) {
  if (!fs.existsSync(getDataFilePath('./TextMap/Plain/'))) {
    fs.mkdirSync(getDataFilePath('./TextMap/Plain/'));
  }

  const controlUserMode: ControlUserMode = {
    inputLangCode: ctrl.inputLangCode,
    outputLangCode: ctrl.outputLangCode,
    searchMode: ctrl.searchMode,
    prefs: ctrl.state.prefs,
    cookies: ctrl.state.controlUserMode.cookies,
  };

  const tasks: WorkerTask[] = [];

  for (let langCode of LANG_CODES) {
    if (langCode === 'CH')
      continue;

    tasks.push({
      langCode,
      siteMode: ctrl.siteMode,
      controlUserMode,
      textMapPath: getDataFilePath(getTextMapRelPath(langCode)),
      outTextPath: getDataFilePath('./TextMap/Plain/PlainTextMap' + langCode + '_Text.dat'),
      outHashPath: getDataFilePath('./TextMap/Plain/PlainTextMap' + langCode + '_Hash.dat'),
    });
  }

  await runPlainTextMapTasksInWorkerPool(tasks);

  console.log(chalk.blue('Done'));
}
