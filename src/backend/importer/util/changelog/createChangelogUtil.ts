import '../../../loadenv.ts';
import path from 'path';
import { SchemaTableSet } from '../../import_db.ts';
import { GameVersion } from '../../../../shared/types/game-versions.ts';
import { AbstractControl } from '../../../domain/abstract/abstractControl.ts';
import { backfillTextmapHashAggs } from '../../../domain/abstract/tmchanges.ts';
import { computeTextMapChanges } from './computeTextMapChanges.ts';
import { computeExcelFileChanges } from './computeExcelFileChanges.ts';
import { LANG_CODES, LangCode } from '../../../../shared/types/lang-types.ts';

export class CreateChangelogOpts {
  readonly prevDataRoot: string;
  readonly currDataRoot: string;
  readonly noPriorChangelog: boolean;
  readonly gameSchema: SchemaTableSet;
  readonly langCodes: LangCode[];

  constructor(readonly ctrl: AbstractControl, readonly version: GameVersion) {
    this.gameSchema = ctrl.schema;
    this.noPriorChangelog = this.version.noPriorChangelog;
    if (!this.noPriorChangelog)
      this.prevDataRoot = path.resolve(ctrl.changelogConfig.archivesDirectory, `./${this.version.prevNumber}`);
    this.currDataRoot = path.resolve(ctrl.changelogConfig.archivesDirectory, `./${this.version.number}`);
    this.langCodes = LANG_CODES.filter(langCode => {
      return !(langCode === 'CH' || ctrl.disabledLangCodes.has(langCode));
    })
    console.info(`Creating changelog for ${this.version.prevNumber} - ${this.version.number} diff`);
  }
}

export async function doChangelogMiscBackfill(ctrl: AbstractControl) {
  await backfillTextmapHashAggs(ctrl.knex);
}

export async function createChangelog(ctrl: AbstractControl,
                                      versionInput: string,
                                      mode: 'textmap' | 'excel' | 'both'): Promise<void> {
  const version: GameVersion = ctrl.gameVersions.get(versionInput);
  if (!version) {
    console.error('Not a valid version: ' + versionInput);
    return;
  }

  const state: CreateChangelogOpts = new CreateChangelogOpts(ctrl, version);

  if (mode === 'textmap' || mode === 'both') {
    if (state.version.showTextmapChangelog) {
      await computeTextMapChanges(state);
    } else {
      console.error('Version ' + version.number + ' does not support textmap changelog');
    }
  }

  if (mode === 'excel' || mode === 'both') {
    if (state.version.showExcelChangelog) {
      await computeExcelFileChanges(state);
    } else {
      console.error('Version ' + version.number + ' does not support excel changelog');
    }
  }
}
