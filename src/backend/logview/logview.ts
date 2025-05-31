import '../loadenv.ts';
import fs from 'fs';
import { concatRegExp, REGEX_ISO_8601, splitLimit } from '../../shared/util/stringUtil.ts';
import { pathToFileURL } from 'url';
import { sha256 } from '../util/hash-util.ts';
import { toInt, toNumber } from '../../shared/util/numberUtil.ts';
import { LogViewEntity } from '../../shared/types/site/site-logview-types.ts';
import { LangCode } from '../../shared/types/lang-types.ts';
import { SearchMode } from '../../shared/util/searchUtil.ts';
import { closeKnex, openPg } from '../util/db.ts';
import { Tail } from 'tail';
import exitHook from 'async-exit-hook';

const regexes = {
  access: /^\[(\d+\/\d+\/\d+), (\d+:\d+:\d+) (AM|PM) PST] \[([^\]]+)] \[(\w{2}):(\w{2})\|(\w+)] (\d{3}) (\w+)(.*)\((\d+\.?\d*) ms\)$/,
  debug: concatRegExp([
    /^/,
    REGEX_ISO_8601,
    /\s(.*)/,
    /$/
  ]),
  other: /^(.*)$/,
  auth_callback: /\/auth\/callback\?code=[^\s]+/,
};

export async function importFileLines(lines: string[], doConsoleLog: boolean = false) {
  const knex = openPg();

  if (doConsoleLog)
    console.log('Importing', lines.length, 'lines...');

  await knex.transaction(async (trx) =>  {
    let batch: LogViewEntity[] = [];
    let batchMax = 1000;
    let batchNum = 0;

    async function addBatchToTransaction() {
      await trx('site_logview').insert(batch).onConflict('sha_hash').ignore();
      batch = [];
      batchNum++;
      if (doConsoleLog)
        console.log('Progress:', batchNum * batchMax);
    }

    for (let line of lines) {
      line = line.trim();

      if (!line || line.startsWith('#')) {
        continue;
      }

      if (line.includes('/auth/callback')) {
        line = line.replace(regexes.auth_callback, '/auth/callback?code=REDACTED');
      }

      if (batch.length >= batchMax) {
        await addBatchToTransaction();
      }

      const sha_hash = sha256(line);
      const accessMatch = regexes.access.exec(line);

      if (accessMatch) {
        const m = accessMatch;

        const date: string[] = m[1].split('/'); // M/D/YYYY
        const time = m[2]; // H:MM:SS
        const amPm = m[3]; // AM/PM
        const timestamp = new Date(`${date[2]}-${date[0]}-${date[1]} ${time} ${amPm} PST`).toISOString();

        const user = m[4];
        let discord_user = null;
        let wiki_user = null;
        if (user !== 'guest' && user.includes(':')) {
          [discord_user, wiki_user] = splitLimit(user, ':', 2);
        }

        const lang_in = m[5] as LangCode;
        const lang_out = m[6] as LangCode;
        const search_mode = m[7] as SearchMode;

        const http_status = toInt(m[8]);
        const http_method = m[9];
        const http_uri = m[10];
        const http_runtime = toNumber(m[11]);

        batch.push({
          sha_hash,
          log_type: 'access',
          timestamp,
          full_content: line,
          content: http_uri,

          discord_user,
          wiki_user,
          lang_in,
          lang_out,
          search_mode,

          http_status,
          http_method,
          http_uri,
          http_runtime,
        });
        continue;
      }

      const debugMatch = regexes.debug.exec(line);
      if (debugMatch) {
        batch.push({
          sha_hash,
          log_type: 'debug',
          timestamp: debugMatch[1],
          full_content: line,
          content: debugMatch[2],
        });
        continue;
      }

      const otherMatch = regexes.other.exec(line);
      if (otherMatch) {
        batch.push({
          sha_hash,
          log_type: 'other',
          timestamp: new Date().toISOString(),
          full_content: line,
          content: otherMatch[1],
        });
      }
    }

    if (batch.length) {
      await addBatchToTransaction();
    }

    if (doConsoleLog)
      console.log('Complete.');
  }).then();
}

let tail: Tail;

export async function stopLogFileWatch() {
  if (!tail) {
    return;
  }
  tail.unwatch();
  tail = null;
}

export async function enableLogFileWatchShutdownHook() {
  exitHook(callback => {
    stopLogFileWatch().finally(() => {
      callback();
    });
  });
}

export async function importLogFile(filePath: string, doConsoleLog: boolean = false) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const fileLines = fileContent.split(/\r?\n/);
  await importFileLines(fileLines, doConsoleLog);
}

export async function startLogFileWatch() {
  if (!process.env.LOGVIEW_FILE) {
    return;
  }
  if (tail) {
    return;
  }

  await importLogFile(process.env.LOGVIEW_FILE);

  tail = new Tail(process.env.LOGVIEW_FILE, {
    follow: true,
    fromBeginning: false,
    encoding: 'utf-8',
  });

  tail.on('line', async (line) => {
    await importFileLines([line]);
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log('Import file:', process.argv[2]);
  if (!process.argv[2] || !fs.existsSync(process.argv[2])) {
    console.log('File not defined or does not exist.');
  } else {
    await importLogFile(process.argv[2], true);
  }
  await closeKnex();
}
