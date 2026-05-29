import { Knex } from 'knex';
import {
  TextMapChangeEntity,
  TextMapChangeRef,
  TextMapChangeRefs, TextMapChanges,
  TextMapChangesForDisplay,
  TextMapFullChangelog, TextMapHashAggEntity, TextMapMultiChangeRefs,
} from '../../../shared/types/changelog-types.ts';
import { LangCode, TextMapHash } from '../../../shared/types/lang-types.ts';
import { AbstractControl } from './abstractControl.ts';
import { GameVersion } from '../../../shared/types/game-versions.ts';
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

  async selectUpdatedTextMapHashes(version: string): Promise<Record<TextMapHash, TextMapChangeEntity[]>> {
    if (this.isDisabled)
      return {};
    const result: Record<TextMapHash, TextMapChangeEntity[]> = {};

    let rows: TextMapChangeEntity[] = await this.knex.select('*').from('textmap_changes')
      .where(cleanEmpty({version, change_type: 'updated'}))
      .then();

    for (let row of rows) {
      if (!result[row.hash])
        result[row.hash] = [];
      result[row.hash].push(row);
    }

    return result;
  }

  async selectChangesForDisplay(version: string, langCode: LangCode, doNormText: boolean): Promise<TextMapChangesForDisplay> {
    const rows: TextMapChangeEntity[] = await this.selectAllRows(version, langCode);

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

  async selectChangeRefs(hash: TextMapHash,
                         langCode: LangCode,
                         doNormText: boolean = false): Promise<TextMapChangeRefs> {
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

    const rows: TextMapChangeEntity[] = await this.knex.select('*')
      .from('textmap_changes')
      .where('lang_code', '=', langCode)
      .andWhere('agg_id', '=',
        this.knex('textmap_hash_aggs')
          .select('agg_id')
          .where('hash', '=', hash))
      .then();

    for (let row of rows) {
      refs.push({
        hash: row.hash,
        aggId: row.agg_id,
        version: this.ctrl.gameVersions.get(row.version),
        changeType: row.change_type,
        value: doNorm(row.content),
        prevValue: doNorm(row.prev_content),
      });
    }
    return new TextMapChangeRefs(refs);
  }

  async selectMultiChangeRefs(hashes: TextMapHash[],
                              langCode: LangCode,
                              doNormText: boolean = false): Promise<TextMapMultiChangeRefs> {
    const out: TextMapMultiChangeRefs = new TextMapMultiChangeRefs();

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
      .andWhere('agg_id', 'in',
        this.knex('textmap_hash_aggs')
          .select('agg_id')
          .whereIn('hash', hashes))
      .then();

    for (let row of rows) {
      out.add({
        hash: row.hash,
        aggId: row.agg_id,
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
async function convertJsonToEntities(knex: Knex, json: TextMapFullChangelog, version: GameVersion): Promise<TextMapChangeEntity[]> {
  console.log('Converting JSON to entities...');

  const rows: TextMapChangeEntity[] = [];
  const allHashes: TextMapHash[] = [];
  const supersedePairs: Array<{ oldHash: TextMapHash; newHash: TextMapHash }> = [];

  // Collect all hashes
  console.log('  Collecting hashes...');
  for (const langCode in json) {
    const changes: TextMapChanges = json[langCode as LangCode];

    for (const hash in changes.added) {
      if (!isEmptyContent(changes.added[hash])) {
        allHashes.push(hash as TextMapHash);
      }
    }

    for (const hash in changes.removed) {
      if (!isEmptyContent(changes.removed[hash])) {
        allHashes.push(hash as TextMapHash);
      }
    }

    for (const hash in changes.updated) {
      allHashes.push(hash as TextMapHash);
    }

    for (let [oldHash, newHash] of Object.entries(changes.superseded)) {
      allHashes.push(oldHash as TextMapHash);
      supersedePairs.push({ oldHash: oldHash as TextMapHash, newHash: newHash as TextMapHash });
    }
  }

  // Acquire all agg IDs in batch
  console.log('  Acquiring Aggregate IDs for hashes...');
  const hashToAggId: Record<TextMapHash, string> = {};

  for (let chunkElement of chunk(allHashes, 5000)) {
    await knex.transaction(async (trx) => {
      Object.assign(hashToAggId, await acquireTmAggId(trx, chunkElement));
    });
  }

  // Handle supersede pairs: save the new hash with Aggregate ID of old hash to ensure continuity of references across supersessions
  if (supersedePairs.length > 0) {
    console.log('  Saving superseding new hashes with old hash\'s Aggregate ID...');
    const supersedeSavePairs: HashAggIdPair[] = supersedePairs.map(pair => ({
      hash: pair.newHash,
      aggId: hashToAggId[pair.oldHash],
    }));
    for (let chunkElement of chunk(supersedeSavePairs, 5000)) {
      await knex.transaction(async (trx) => {
        await saveTmAggId(trx, chunkElement);
      });
    }
  }

  // Build rows
  console.log('  Building rows...');
  for (const langCode in json) {
    const changes: TextMapChanges = json[langCode as LangCode];

    // Added
    for (const hash in changes.added) {
      if (isEmptyContent(changes.added[hash])) {
        continue;
      }
      rows.push({
        version: version.number,
        lang_code: langCode as LangCode,
        hash,
        agg_id: hashToAggId[hash],
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
        agg_id: hashToAggId[hash],
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
        agg_id: hashToAggId[hash],
        change_type: 'updated',
        content: change.newValue,
        prev_content: change.oldValue,
      });
    }

    // Superseded
    for (let [oldHash, newHash] of Object.entries(changes.superseded)) {
      rows.push({
        version: version.number,
        lang_code: langCode as LangCode,
        hash: newHash,
        prev_hash: oldHash,
        agg_id: hashToAggId[oldHash],
        change_type: 'superseded',
      });
    }
  }

  return rows;
}

function convertEntitiesToJson(
  entities: TextMapChangeEntity[]
): TextMapFullChangelog {
  const result: Partial<TextMapFullChangelog> = {};

  for (const row of entities) {
    const { lang_code, hash, prev_hash, change_type, content, prev_content } = row;

    if (!result[lang_code]) {
      result[lang_code] = {
        langCode: lang_code as LangCode,
        added: {},
        removed: {},
        updated: {},
        superseded: {}
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
      case 'superseded':
        changes.superseded[prev_hash] = hash;
        break;
    }
  }

  return result as TextMapFullChangelog;
}
// endregion

// region IMPORTER
// --------------------------------------------------------------------------------------------------------------

/** Utility function: split an array into chunks of the given size */
function chunk<T>(arr: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }
  return result;
}

/**
 * Insert TextMap changes into DB using Knex.js with batching and transaction
 */
export async function importTextMapChanges(
  knex: Knex,
  json: TextMapFullChangelog,
  version: GameVersion,
  batchSize = 5000
) {
  const rows: TextMapChangeEntity[] = await convertJsonToEntities(knex, json, version);

  console.log('-'.repeat(100));
  console.log(`[${version.number}] Inserting textmap changelog for ${version.label} - ${rows.length} entitites`);

  let deletedCount = await knex('textmap_changes')
    .where('version', version.number)
    .del();
  if (deletedCount > 0) {
    console.log(`[${version.number}] Deleted ${deletedCount} existing entities for this version (you are reimporting)`);
  }

  await knex.transaction(async (trx) => {
    const batches: TextMapChangeEntity[][] = chunk(rows, batchSize);

    let batchNum: number = 0;
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

/**
 * Acquire aggregate IDs for the given hashes in the batch. Either returns existing aggregate IDs for the hashes
 * or generates new ones if hashes are not yet in the database, inserts those into the database and returns them.
 * @param db
 * @param hashes
 */
async function acquireTmAggId(db: Knex|Knex.Transaction, hashes: TextMapHash[]): Promise<Record<TextMapHash, string>> {
  if (!hashes.length) {
    return {};
  }

  // Convert to string for deduplication, then back to original
  const hashStringMap = new Map<string, TextMapHash>();
  const uniqueHashes: TextMapHash[] = [];
  for (const hash of hashes) {
    const hashStr = String(hash);
    if (!hashStringMap.has(hashStr)) {
      hashStringMap.set(hashStr, hash);
      uniqueHashes.push(hash);
    }
  }

  const result: Record<TextMapHash, string> = {};

  // Try to insert all hashes at once
  const insertedRows = await db<TextMapHashAggEntity>("textmap_hash_aggs")
    .insert(uniqueHashes.map(hash => ({
      hash,
      agg_id: db.raw("gen_random_uuid()"),
    })))
    .onConflict("hash")
    .ignore()
    .returning<{ hash: TextMapHash; agg_id: string }[]>(["hash", "agg_id"]);

  // Add the newly inserted rows to the result
  for (const row of insertedRows) {
    result[row.hash] = row.agg_id;
  }

  // Query for hashes that already existed (those not in insertedRows)
  const insertedHashStrs = new Set(insertedRows.map(row => String(row.hash)));
  const missingHashes = uniqueHashes.filter(hash => !insertedHashStrs.has(String(hash)));

  if (missingHashes.length > 0) {
    const existingRows = await db<TextMapHashAggEntity>("textmap_hash_aggs")
      .select(["hash", "agg_id"])
      .whereIn("hash", missingHashes.map(h => String(h)) as any);

    for (const row of existingRows) {
      result[row.hash] = row.agg_id;
    }

    // Verify all hashes were found
    for (const hash of missingHashes) {
      if (!result[hash]) {
        throw new Error(
          `Failed to get agg_id for hash ${hash}; row conflicted but was not visible`,
        );
      }
    }
  }

  return result;
}

type HashAggIdPair = { hash: TextMapHash; aggId: string };

async function saveTmAggId(db: Knex|Knex.Transaction, pairs: HashAggIdPair[]): Promise<void> {
  if (!pairs.length) {
    return;
  }

  await db<TextMapHashAggEntity>("textmap_hash_aggs")
    .insert(pairs.map(pair => ({
      hash: pair.hash,
      agg_id: pair.aggId,
    })))
    .onConflict("hash")
    .merge();
}
// endregion

// region BACKFILLER
export async function backfillTextmapHashAggs(knex: Knex) {
  const hashes: string[] = (
    await knex('textmap_changes').distinct<{ hash: string }[]>('hash')
  ).map(row => row.hash);

  const hashChunks = chunk(hashes, 1000);

  console.log('Chunk count: ' + hashChunks.length);

  let numChunksLooped = 0;
  for (let hashChunk of hashChunks) {
    console.log(`Chunk ${++numChunksLooped} of ${hashChunks.length}`);
    await knex.transaction(async (trx) => {
      await acquireTmAggId(trx, hashChunk as TextMapHash[]);
    });
  }

  console.log('Done');
}
// endregion
