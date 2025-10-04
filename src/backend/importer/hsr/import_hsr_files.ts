// noinspection DuplicatedCode

import '../../loadenv.ts';
import { pathToFileURL } from 'url';
import commandLineArgs, { OptionDefinition as ArgsOptionDefinition } from 'command-line-args';
import commandLineUsage, { OptionDefinition as UsageOptionDefinition } from 'command-line-usage';
import chalk from 'chalk';
import { getStarRailDataFilePath } from '../../loadenv.ts';
import { closeKnex } from '../../util/db.ts';
import { importPlainTextMap } from '../util/import_file_util.ts';
import fs from 'fs';
import { getStarRailControl, loadStarRailVoiceItems } from '../../domain/hsr/starRailControl.ts';
import { fetchVoiceAtlases } from '../../domain/hsr/character/fetchVoiceAtlas.ts';
import { indexStarRailImages } from './module.index-images.ts';
import { starRailNormalize } from './module.normalize.ts';
import { createChangelog } from '../util/createChangelogUtil.ts';
import { StarRailVersions } from '../../../shared/types/game-versions.ts';
import { starRailSchema } from './hsr.schema.ts';
import { recordNewStarRailImages } from './module.new-images.ts';
import { importTextMapChanges } from '../../domain/abstract/tmchanges.ts';
import { isset } from '../../../shared/util/genericUtil.ts';
import { doImportExcelScalars } from '../util/excel_usages_importer.ts';

async function importVoiceOvers() {
  const outDir = ENV.HSR_DATA_ROOT;
  await loadStarRailVoiceItems();

  const ctrl = getStarRailControl();
  const voiceAtlases = await fetchVoiceAtlases(ctrl, true);

  fs.writeFileSync(outDir + '/VoiceOvers.json', JSON.stringify(voiceAtlases, null, 2));
  console.log(chalk.blue('Done. Output written to: ' + outDir + '/VoiceOvers.json'));
}

export async function importHsrFilesCli() {
  const options_beforeDb: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
    {name: 'normalize', type: Boolean, description: 'Normalizes the JSON files.'},
    {name: 'plaintext', type: Boolean, description: 'Creates the PlainTextMap files.'},
  ];

  const options_agnosticDb: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
    {name: 'new-images', type: Boolean, description: 'Creates new images map per game version. Must be ran before index-images.'},
    {name: 'index-images', type: String, typeLabel: 'full_import | cat_map_only', description: 'Creates index for asset images. ' +
        'Must load all wanted Texture2D images into the EXT_HSR_IMAGES directory first though.'},
    {name: 'excel-scalars', type: Boolean, description: 'Import excel scalars for excel usages.'},
  ];

  const options_afterDb: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
    {name: 'voice-overs', type: Boolean, description: 'Creates the VoiceOvers file.'},
    {name: 'changelog', type: String, typeLabel: '<version>', description: 'Creates changelog between the provided version and the version before it.'},
    {name: 'changelog-tmimport', type: String, typeLabel: '<version>', description: 'Imports textmap changelog into the database (changelog must be ran first).'},
  ];

  const options_util: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
    {name: 'help', type: Boolean, description: 'Display this usage guide.'},
  ];

  let options: commandLineArgs.CommandLineOptions;
  try {
    options = commandLineArgs([... options_beforeDb, ...options_agnosticDb, ... options_afterDb, ... options_util]);
  } catch (e) {
    if (typeof e === 'object' && e.name === 'UNKNOWN_OPTION') {
      console.warn(chalk.red('\nUnknown option: ' + e.optionName));
    } else {
      console.error(chalk.red('\n' + e?.message || e));
    }
    options = { help: true };
  }

  if (!Object.keys(options).length) {
    console.warn(chalk.yellow('\nNot enough arguments.'));
    options.help = true;
  }

  if (Object.keys(options).length > 1) {
    console.warn(chalk.red('\nAll arguments are mutually exclusive.'));
    options.help = true;
  }

  if (options.help) {
    const usage = commandLineUsage([
      {
        header: 'Star Rail Data Files Importer',
        content: 'Imports Star Rail Data json into other supporting files.'
      },
      {
        header: 'Must be ran before database import:',
        optionList: options_beforeDb
      },
      {
        header: 'Database import agnostic (can be run before or after)',
        optionList: options_agnosticDb
      },
      {
        header: 'Must be ran after database import:',
        optionList: options_afterDb
      },
      {
        header: 'Util',
        optionList: options_util
      }
    ])
    console.log(usage);
    return;
  }

  if (options.normalize) {
    await starRailNormalize();
  }
  if (options['voice-overs']) {
    await importVoiceOvers();
  }
  if (options['new-images']) {
    await recordNewStarRailImages();
  }
  if (isset(options['index-images'])) {
    const mode: string = options['index-images'];
    if (!['full_import', 'cat_map_only'].includes(mode)) {
      console.warn(chalk.red('\nInvalid option: ' + mode));
      return;
    }
    await indexStarRailImages(mode === 'cat_map_only');
  }
  if (options.plaintext) {
    const ctrl = getStarRailControl();
    await importPlainTextMap(ctrl, getStarRailDataFilePath);
  }
  if (options['changelog']) {
    await createChangelog(ENV.HSR_CHANGELOGS, ENV.HSR_ARCHIVES, starRailSchema, StarRailVersions, options['changelog']);
  }
  if (options['changelog-tmimport']) {
    await importTextMapChanges(getStarRailControl(), options['changelog-tmimport']);
  }
  if (options['excel-scalars']) {
    await doImportExcelScalars(getStarRailControl());
  }

  await closeKnex();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await importHsrFilesCli();
}
