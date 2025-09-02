import { Knex } from 'knex';
import { TextMapChangeEntity, TextMapFullChangelog } from '../../../shared/types/changelog-types.ts';
import { LangCode } from '../../../shared/types/lang-types.ts';
import { pathToFileURL } from 'url';
import { getGenshinControl } from '../genshin/genshinControl.ts';
import path from 'path';
import { fsReadJson } from '../../util/fsutil.ts';
import { AbstractControl } from './abstractControl.ts';
import { GameVersion } from '../../../shared/types/game-versions.ts';
import fs from 'fs'; // optional for batching

const isEmptyContent = (str: string) => typeof str === 'undefined' || str === null || str === '';

/**
 * Convert JSON changelog to rows suitable for insertion
 */
function convertToRows(json: TextMapFullChangelog, version: string): TextMapChangeEntity[] {
  const rows: TextMapChangeEntity[] = [];

  for (const langCode in json) {
    const changes = json[langCode as LangCode];

    // Added
    for (const hash in changes.added) {
      if (isEmptyContent(changes.added[hash])) {
        continue;
      }
      rows.push({
        version,
        lang_code: langCode as LangCode,
        hash,
        change_type: 'added',
        content: changes.added[hash],
      });
    }

    // Removed
    for (const hash in changes.removed) {
      if (isEmptyContent(changes.removed[hash])) {
        continue;
      }
      rows.push({
        version,
        lang_code: langCode as LangCode,
        hash,
        change_type: 'removed',
        content: changes.removed[hash],
      });
    }

    // Updated
    for (const hash in changes.updated) {
      const change = changes.updated[hash];
      rows.push({
        version,
        lang_code: langCode as LangCode,
        hash,
        change_type: 'updated',
        content: change.newValue,
        prev_content: change.oldValue,
      });
    }
  }

  return rows;
}

/** Utility function: split an array into chunks of given size */
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Insert TextMap changes into DB using Knex.js with batching and transaction
 */
export async function insertTextMapChanges(
  knex: Knex,
  json: TextMapFullChangelog,
  version: string,
  batchSize = 5000
) {
  const rows = convertToRows(json, version);

  console.log('-'.repeat(100))
  console.log(`[${version}] Inserting changelog for ${version}`);

  await knex.transaction(async (trx) => {
    const batches = chunk(rows, batchSize);

    let batchNum = 0;
    for (const batch of batches) {
      batchNum++;
      await trx('textmap_changes').insert(batch)
        .onConflict(['version', 'lang_code', 'hash'])
        .merge();
      console.log(`[${version}] Batch ${batchNum}/${batches.length}`);
    }
  });

  console.log(`[${version}] Done`);
}

export async function importTextMapChanges(ctrl: AbstractControl, versionTarget: string) {
  console.log('Inserting changelogs...');

  async function doForVersion(version: GameVersion) {
    const textmapChangelogFileName = path.resolve(ctrl.changelogConfig.directory, `./TextMapChangeLog.${version.number}.json`);
    if (!fs.existsSync(textmapChangelogFileName)) {
      throw new Error('No textmap changelog exists for ' + version.number);
    }
    const json: TextMapFullChangelog = await fsReadJson(textmapChangelogFileName);
    await insertTextMapChanges(ctrl.knex, json, version.number);
  }

  if (versionTarget === 'ALL') {
    const versions = ctrl.gameVersions.filter(v => v.showTextmapChangelog);
    for (let version of versions) {
      await doForVersion(version);
    }
  } else {
    const version = ctrl.gameVersions.find(v => v.showTextmapChangelog && v.number === versionTarget);
    if (version) {
      await doForVersion(version);
    } else {
      throw new Error(`Not a valid version: ${version}`);
    }
  }

  console.log('All complete');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ctrl = getGenshinControl();
  await importTextMapChanges(ctrl, 'ALL');
}
