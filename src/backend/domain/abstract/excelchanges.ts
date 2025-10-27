import { Knex } from 'knex';
import {
  buildExcelFullChangelog, ExcelChangeEntity,
  ExcelChangeRecord, ExcelChangeRef,
  ExcelVersionChangelog, TextMapChangeEntity, TextMapFullChangelog, toExcelChangeEntity, toExcelChangeRecord,
} from '../../../shared/types/changelog-types.ts';
import { AbstractControl } from './abstractControl.ts';
import { GameVersion } from '../../../shared/types/game-versions.ts';

// region INTERFACE
// --------------------------------------------------------------------------------------------------------------
export class ExcelChangelog {
  constructor(readonly ctrl: AbstractControl) {
  }

  public get isEnabled(): boolean {
    return this.ctrl.changelogConfig.excelEnabled;
  }

  public get isDisabled(): boolean {
    return !this.ctrl.changelogConfig.excelEnabled;
  }

  private get knex(): Knex {
    return this.ctrl.knex;
  }

  private toRef(changeRecord: ExcelChangeRecord): ExcelChangeRef {
    return {
      ... changeRecord,
      version: this.ctrl.gameVersions.get(changeRecord.versionNumber)
    };
  }

  private toRefs(changeRecords: ExcelChangeRecord[]): ExcelChangeRef[] {
    return changeRecords.map(r => this.toRef(r));
  }

  async selectVersionAggregate(gameVersion: GameVersion): Promise<ExcelVersionChangelog> {
    const records: ExcelChangeRecord[] = await this.selectChangeRefsByVersion(gameVersion.number);
    return buildExcelFullChangelog(records, gameVersion);
  }

  async selectChangeRefsByVersion(version: string): Promise<ExcelChangeRef[]> {
    if (this.isDisabled)
      return [];

    const rows = await this.knex('excel_changes')
      .select('json')
      .where({ version })
      .then();
    return this.toRefs(rows.map(row => toExcelChangeRecord(row)));
  }

  async selectChangeRefAddedAt(id: string|number): Promise<ExcelChangeRef[]>
  async selectChangeRefAddedAt(id: string|number, excelFile: string): Promise<ExcelChangeRef>
  async selectChangeRefAddedAt(id: string|number, excelFile?: string): Promise<ExcelChangeRef|ExcelChangeRef[]> {
    return (await this.selectChangeRefs(id)).filter(r => r.changeType === 'added');
  }

  async selectChangeRefs(key: string|number, excelFile?: string): Promise<ExcelChangeRef[]> {
    if (this.isDisabled)
      return [];
    if (excelFile && excelFile.endsWith('.json')) {
      excelFile = excelFile.slice(0, -5);
    }

    const query = this.knex('excel_changes')
      .select('json')
      .where({ key: String(key) });

    if (excelFile) {
      query.andWhere({ excel_file: excelFile });
    }

    const rows = await query;
    return this.toRefs(rows.map(row => toExcelChangeRecord(row)));
  }
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
export async function importExcelChanges(
  knex: Knex,
  json: ExcelChangeRecord[],
  version: GameVersion,
  batchSize = 5000
) {
  const rows: ExcelChangeEntity[] = json.map(r => toExcelChangeEntity(r));

  console.log('-'.repeat(100))
  console.log(`[${version.number}] Inserting excel changelog for ${version.label}`);

  let deletedCount = await knex('excel_changes')
    .where('version', version.number)
    .del();
  if (deletedCount > 0) {
    console.log(`[${version.number}] Deleted ${deletedCount} existing entities for this version (you are reimporting)`);
  }

  await knex.transaction(async (trx) => {
    const batches: ExcelChangeEntity[][] = chunk(rows, batchSize);

    let batchNum: number = 0;
    for (const batch of batches) {
      batchNum++;
      await trx('excel_changes').insert(batch)
        .onConflict(['excel_file', 'version', 'key'])
        .merge();
      console.log(`[${version.number}] Batch ${batchNum}/${batches.length}`);
    }
  });

  console.log(`[${version.number}] Done`);
}
// endregion
