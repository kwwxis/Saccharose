import { getGenshinDataFilePath } from '../../loadenv.ts';
import path from 'path';
import fs, { promises as fsp } from 'fs';
import os from 'os';
import { isMainThread, parentPort, Worker } from 'worker_threads';
import {
  createPropertySchema,
  createPropertySchemaPostProcess_imprintEmptyArrays,
  PropertySchemaResult,
} from '../schema/translate_schema.ts';
import { normalizeRawJson } from '../import_db.ts';
import { genshinSchema } from './genshin.schema.ts';
import { parseJsonConvertingBigIntsToStrings } from '../../util/jsonbig.ts';
import { reformatPrimitiveArrays } from '../../../shared/util/stringUtil.ts';

// region Worker Pool
// --------------------------------------------------------------------------------------------------------------
// `createPropertySchema` is the bottleneck of this module: it's CPU-bound and, for some schemas, can take
// multiple minutes. The pool below runs it inside worker threads (one call at a time per worker) so that a
// slow schema never blocks the (much more common) fast ones - fast tasks keep flowing through the other
// workers in the pool while a slow one runs to completion on its own thread.
type SchemaTask = {
  schemaName: string;
  schemaFilePath: string;
  absJsonPath: string;
  outJsonPath: string;
  visitMaxPairs: number;
  maxRecordsSlice: number;
};

type WorkerRequest =
  | { task: SchemaTask }
  | { exit: true };

type WorkerResponse =
  | { schemaName: string; ok: true }
  | { schemaName: string; error: string };

function runSchemaTasksInWorkerPool(tasks: SchemaTask[]): Promise<void> {
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
      console.log('Processing ' + task.schemaName);
      console.time('Processed ' + task.schemaName);
      const req: WorkerRequest = { task };
      worker.postMessage(req);
    }

    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(new URL(import.meta.url), {
        execArgv: process.execArgv,
      });

      worker.on('message', (msg: WorkerResponse) => {
        console.timeEnd('Processed ' + msg.schemaName);

        if ('error' in msg) {
          console.error(`Error processing ${msg.schemaName}: ${msg.error}`);
        }

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

    const { schemaName, schemaFilePath, absJsonPath, outJsonPath, visitMaxPairs, maxRecordsSlice } = msg.task;
    try {
      const propertySchema: PropertySchemaResult = await createPropertySchema(
        genshinSchema,
        schemaName,
        schemaFilePath,
        absJsonPath,
        visitMaxPairs,
        maxRecordsSlice,
      );

      let json = await fsp.readFile(absJsonPath, { encoding: 'utf8' })
        .then(data => parseJsonConvertingBigIntsToStrings(data));

      json = normalizeRawJson(json, genshinSchema[schemaName], propertySchema.map);
      createPropertySchemaPostProcess_imprintEmptyArrays(json, propertySchema.arrayPaths);

      fs.writeFileSync(outJsonPath, reformatPrimitiveArrays(JSON.stringify(json, null, 2)));

      const res: WorkerResponse = { schemaName, ok: true };
      parentPort?.postMessage(res);
    } catch (err: any) {
      const res: WorkerResponse = { schemaName, error: err?.stack || err?.message || String(err) };
      parentPort?.postMessage(res);
    }
  });
}
// endregion

export async function writeDeobfExcels() {
  function getSchemaFilePath(filePath: string): string {
    return path.resolve(ENV.GENSHIN_ARCHIVES, `./5.4/ExcelBinOutput/`, filePath);
  }

  const rawExcelDirPath = getGenshinDataFilePath('./ExcelBinOutput.Raw');
  const mappedExcelDirPath = getGenshinDataFilePath('./ExcelBinOutput');

  fs.mkdirSync(mappedExcelDirPath, { recursive: true });

  const schemaNamesForCopyOnly = [
    'MainQuestExcelConfigData',
    'QuestExcelConfigData',
    'TalkExcelConfigData',
    'DialogExcelConfigData',
    'DialogUnparentedExcelConfigData',
    'CodexQuestExcelConfigData',
  ];

  const schemaNamesVisitMaxPairs: Record<string, number> = { };
  const schemaNamesMaxRecordSlice: Record<string, number> = {
    'MaterialSourceDataExcelConfigData': 100,
    'ProudSkillExcelConfigData': 200,
    'ReminderExcelConfigData': 200,
    'GadgetExcelConfigData': 50,
    'FettersExcelConfigData': 50,
    'ManualTextMapConfigData': 5,
  };

  let startAt: string = null; // inclusive
  let endAt: string = null; // inclusive
  let didStart: boolean = (s => !s)(startAt);

  // noinspection JSMismatchedCollectionQueryUpdate (empty array: whitelist not enabled)
  const whitelist: string[] = [];

  const schemaTasks: SchemaTask[] = [];

  const jsonsInDir = fs.readdirSync(rawExcelDirPath).filter(file => path.extname(file) === '.json');
  for (let _jsonFile of jsonsInDir) {
    const fileName = path.basename(_jsonFile);
    const schemaName = fileName.split('.')[0];

    if (whitelist && whitelist.length && !whitelist.includes(schemaName)) {
      continue;
    }

    if (schemaName === startAt) {
      didStart = true;
    }

    if (!didStart) {
      continue;
    }

    const schemaFilePath = getSchemaFilePath(fileName);
    if (!fs.existsSync(schemaFilePath)) {
      console.log('EXCEL not in schema - ' + schemaName);

      const absJsonPath = path.resolve(rawExcelDirPath, fileName);
      let json = await fsp.readFile(absJsonPath, { encoding: 'utf8' })
        .then(data => parseJsonConvertingBigIntsToStrings(data));
      json = normalizeRawJson(json);
      fs.writeFileSync(path.resolve(mappedExcelDirPath, './' + schemaName + '.json'),
        reformatPrimitiveArrays(JSON.stringify(json, null, 2)));
    } else if (schemaNamesForCopyOnly.includes(schemaName)) {
      console.log('Processing (copy-only) ' + schemaName);
      console.time('Processed ' + schemaName);

      const absJsonPath = path.resolve(rawExcelDirPath, fileName);
      let json = await fsp.readFile(absJsonPath, { encoding: 'utf8' })
        .then(data => parseJsonConvertingBigIntsToStrings(data));

      fs.writeFileSync(path.resolve(mappedExcelDirPath, './' + schemaName + '.json'),
        reformatPrimitiveArrays(JSON.stringify(json, null, 2)));
      console.timeEnd('Processed ' + schemaName);
    } else {
      // Deferred to the worker pool below: the worker calls createPropertySchema and also performs the
      // subsequent read/normalize/imprint/write for this schema, all in parallel across CPU cores.
      const absJsonPath = path.resolve(rawExcelDirPath, fileName);
      schemaTasks.push({
        schemaName,
        schemaFilePath,
        absJsonPath,
        outJsonPath: path.resolve(mappedExcelDirPath, './' + schemaName + '.json'),
        visitMaxPairs: schemaNamesVisitMaxPairs[schemaName],
        maxRecordsSlice: schemaNamesMaxRecordSlice[schemaName],
      });
    }

    if (schemaName === endAt) {
      break;
    }
  }

  await runSchemaTasksInWorkerPool(schemaTasks);

  console.log('Done');
}

