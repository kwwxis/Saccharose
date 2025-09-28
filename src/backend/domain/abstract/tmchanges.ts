import { Knex } from 'knex';
import {
  TextMapChangeEntity,
  TextMapChangeRef,
  TextMapChangeRefs,
  TextMapChangesForDisplay,
  TextMapFullChangelog,
} from '../../../shared/types/changelog-types.ts';
import { LangCode, TextMapHash } from '../../../shared/types/lang-types.ts';
import path from 'path';
import { fsReadJson } from '../../util/fsutil.ts';
import { AbstractControl } from './abstractControl.ts';
import { GameVersion, GameVersions } from '../../../shared/types/game-versions.ts';
import fs from 'fs';
import { cleanEmpty } from '../../../shared/util/arrayUtil.ts';
import { isUnset } from '../../../shared/util/genericUtil.ts';

// region INTERFACE
// --------------------------------------------------------------------------------------------------------------
export class TextMapChangelog {
  constructor(readonly ctrl: AbstractControl) {}

  public get isEnabled(): boolean {
    return this.ctrl.changelogConfig.textmapEnabled;
  }

  public get isDisabled(): boolean {
    return !this.ctrl.changelogConfig.textmapEnabled;
  }

  private get knex(): Knex {
    return this.ctrl.knex;
  }

  async selectFullChangelog(version: string): Promise<TextMapFullChangelog> {
    const rows: TextMapChangeEntity[] = this.isDisabled ? [] : await this.selectAllRows(version);
    return convertEntitiesToJson(rows);
  }

  async selectAllRows(version: string, langCode?: LangCode): Promise<TextMapChangeEntity[]> {
    if (this.isDisabled)
      return [];
    return await this.knex.select('*').from('textmap_changes')
      .where(cleanEmpty({version, lang_code: langCode}))
      .then();
  }

  async selectChangesForDisplay(version: string, langCode: LangCode, doNormText: boolean): Promise<TextMapChangesForDisplay> {
    const rows: TextMapChangeEntity[] = await this.selectAllRows(version, langCode);
    console.log({
      version,
      langCode,
      rowcount: rows.length
    })

    const out: TextMapChangesForDisplay = {
      langCode: langCode,
      added: [],
      removed: [],
      updated: [],
    };

    const normFunction = (str: string) => {
      if (isUnset(str)) {
        return '';
      }
      if (doNormText) {
        return this.ctrl.normText(str, langCode);
      } else {
        return str;
      }
    }

    for (let row of rows) {
      switch (row.change_type) {
        case 'added':
          out.added.push({ textMapHash: row.hash, text: normFunction(row.content) });
          break;
        case 'removed':
          out.removed.push({ textMapHash: row.hash, text: normFunction(row.content) });
          break;
        case 'updated':
          let newText = row.content;
          let oldText = row.prev_content;

          newText = normFunction(newText);
          oldText = normFunction(oldText);

          out.updated.push({ textMapHash: row.hash, oldText, newText });
          break;
      }
    }

    return out;
  }

  async selectChangeRefs(hash: TextMapHash, langCode: LangCode, doNormText: boolean = false): Promise<TextMapChangeRefs> {
    if (this.isDisabled)
      return new TextMapChangeRefs([]);

    const refs: TextMapChangeRef[] = [];

    const doNorm = (text: string) => {
      if (doNormText) {
        return this.ctrl.normText(text, langCode);
      } else {
        return text;
      }
    };

    const rows: TextMapChangeEntity[] = await this.knex.select('*').from('textmap_changes')
      .where({
        hash: hash,
        lang_code: langCode
      })
      .then();

    for (let row of rows) {
      refs.push({
        version: this.ctrl.gameVersions.get(row.version),
        changeType: row.change_type,
        value: doNorm(row.content),
        prevValue: doNorm(row.prev_content),
      });
    }
    return new TextMapChangeRefs(refs);
  }

  async selectMultiChangeRefs(hashes: TextMapHash[], langCode: LangCode, doNormText: boolean = false): Promise<Record<TextMapHash, TextMapChangeRefs>> {
    const out: Record<TextMapHash, TextMapChangeRefs> = {};

    for (let hash of hashes) {
      out[hash] = new TextMapChangeRefs([]);
    }

    if (this.isDisabled || !hashes.length)
      return out;

    const doNorm = (text: string) => {
      if (doNormText) {
        return this.ctrl.normText(text, langCode);
      } else {
        return text;
      }
    };

    const rows: TextMapChangeEntity[] = await this.knex.select('*').from('textmap_changes')
      .where('lang_code', langCode)
      .whereIn('hash', hashes)
      .then();

    for (let row of rows) {
      out[row.hash].list.push({
        version: this.ctrl.gameVersions.get(row.version),
        changeType: row.change_type,
        value: doNorm(row.content),
        prevValue: doNorm(row.prev_content),
      });
    }
    return out;
  }
}
// endregion

// region JSON-ENTITY CONVERTER
// --------------------------------------------------------------------------------------------------------------
const isEmptyContent = (str: string) => typeof str === 'undefined' || str === null || str === '';

/**
 * Convert JSON changelog to rows suitable for insertion
 */
function convertJsonToEntities(json: TextMapFullChangelog, version: GameVersion): TextMapChangeEntity[] {
  const rows: TextMapChangeEntity[] = [];

  for (const langCode in json) {
    const changes = json[langCode as LangCode];

    // Added
    for (const hash in changes.added) {
      if (isEmptyContent(changes.added[hash])) {
        continue;
      }
      rows.push({
        version: version.number,
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
        version: version.number,
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
        version: version.number,
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

export function convertEntitiesToJson(
  entities: TextMapChangeEntity[]
): TextMapFullChangelog {
  const result: Partial<TextMapFullChangelog> = {};

  for (const row of entities) {
    const { lang_code, hash, change_type, content, prev_content } = row;

    if (!result[lang_code]) {
      result[lang_code] = {
        langCode: lang_code as LangCode,
        added: {},
        removed: {},
        updated: {},
      };
    }

    const changes = result[lang_code]!;

    switch (change_type) {
      case 'added':
        changes.added[hash] = content;
        break;
      case 'removed':
        changes.removed[hash] = content;
        break;
      case 'updated':
        changes.updated[hash] = {
          newValue: content,
          oldValue: prev_content,
        };
        break;
    }
  }

  return result as TextMapFullChangelog;
}
// endregion

// region IMPORTER
// --------------------------------------------------------------------------------------------------------------

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
async function insertTextMapChanges(
  knex: Knex,
  json: TextMapFullChangelog,
  version: GameVersion,
  batchSize = 5000
) {
  const rows = convertJsonToEntities(json, version);

  console.log('-'.repeat(100))
  console.log(`[${version.number}] Inserting changelog for ${version.label}`);

  await knex.transaction(async (trx) => {
    const batches = chunk(rows, batchSize);

    let batchNum = 0;
    for (const batch of batches) {
      batchNum++;
      await trx('textmap_changes').insert(batch)
        .onConflict(['version', 'lang_code', 'hash'])
        .merge();
      console.log(`[${version.number}] Batch ${batchNum}/${batches.length}`);
    }
  });

  console.log(`[${version.number}] Done`);
}

export async function importTextMapChanges(ctrl: AbstractControl, versionTarget: string) {
  console.log('Inserting changelogs...');

  async function doForVersion(version: GameVersion) {
    const textmapChangelogFileName = path.resolve(ctrl.changelogConfig.directory, `./TextMapChangeLog.${version.number}.json`);
    if (!fs.existsSync(textmapChangelogFileName)) {
      throw new Error('No textmap changelog exists for ' + version.number);
    }
    const json: TextMapFullChangelog = await fsReadJson(textmapChangelogFileName);
    await insertTextMapChanges(ctrl.knex, json, version);
  }

  if (versionTarget === 'ALL') {
    for (let version of ctrl.gameVersions.where(v => v.showTextmapChangelog).list) {
      await doForVersion(version);
    }
  } else {
    const version = ctrl.gameVersions.get(versionTarget);
    if (version && !version.showTextmapChangelog) {
      throw new Error(`Version does not allow textmap changelog: ${version}`)
    } else if (version) {
      await doForVersion(version);
    } else {
      throw new Error(`Not a valid version: ${version}`);
    }
  }

  console.log('All complete');
}
// endregion
