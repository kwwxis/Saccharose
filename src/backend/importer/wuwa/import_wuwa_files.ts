// noinspection DuplicatedCode

import '../../loadenv.ts';
import { pathToFileURL } from 'url';
import commandLineArgs, { OptionDefinition as ArgsOptionDefinition } from 'command-line-args';
import commandLineUsage, { OptionDefinition as UsageOptionDefinition } from 'command-line-usage';
import chalk from 'chalk';
import { getWuwaDataFilePath } from '../../loadenv.ts';
import { getWuwaControl } from '../../domain/wuwa/wuwaControl.ts';
import { closeKnex } from '../../util/db.ts';
import { importNormalize, importPlainTextMap } from '../util/import_file_util.ts';
import fs from 'fs';
import { indexWuwaImages } from './module.index-images.ts';
import { fetchFavorWords } from '../../domain/wuwa/character/fetchRoleFavorWords.ts';
import { createChangelog } from '../util/createChangelogUtil.ts';
import { wuwaNormalize } from './module.normalize.ts';
import { isset } from '../../../shared/util/genericUtil.ts';
import { doImportExcelScalars } from '../util/excel_usages_importer.ts';

async function importVoiceOvers() {
  const outDir = ENV.WUWA_DATA_ROOT;

  const ctrl = getWuwaControl();
  const favorWordGroups = await fetchFavorWords(ctrl, true);

  fs.writeFileSync(outDir + '/VoiceOvers.json', JSON.stringify(favorWordGroups, null, 2));
  console.log(chalk.blue('Done. Output written to: ' + outDir + '/VoiceOvers.json'));
}

export async function importWuwaFilesCli() {
  const options_beforeDb: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
    {name: 'normalize', type: Boolean, description: 'Normalizes the JSON files.'},
    {name: 'plaintext', type: Boolean, description: 'Creates the PlainTextMap files.'},
  ];

  const options_agnosticDb: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
    {name: 'index-images', type: String, typeLabel: 'full_import | cat_map_only', description: 'Creates index for asset images. ' +
        'Must load all wanted Texture2D images into the EXT_WUWA_IMAGES directory first though.'},
    {name: 'excel-scalars', type: Boolean, description: 'Import excel scalars for excel usages.'},
  ];

  const options_afterDb: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
    {name: 'voice-overs', type: Boolean, description: 'Creates the VoiceOvers file.'},
    {name: 'changelog-tm', type: String, typeLabel: '<version>',
      description: 'Creates textmap changelog between the provided version and the version before it.'},
    {name: 'changelog-ex', type: String, typeLabel: '<version>',
      description: 'Creates excel data changelog between the provided version and the version before it (changelog-tm must be ran first)'},
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
        header: 'Wuthering Waves Files Importer',
        content: 'Imports Wuthering Waves Data json into other supporting files.'
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
    await wuwaNormalize();
  }
  if (options['voice-overs']) {
    await importVoiceOvers();
  }
  if (isset(options['index-images'])) {
    const mode: string = options['index-images'];
    if (!['full_import', 'cat_map_only'].includes(mode)) {
      console.warn(chalk.red('\nInvalid option: ' + mode));
      return;
    }
    await indexWuwaImages(mode === 'cat_map_only');
  }
  if (options.plaintext) {
    const ctrl = getWuwaControl();
    await importPlainTextMap(ctrl, getWuwaDataFilePath);
  }
  if (options['changelog-tm']) {
    await createChangelog(getWuwaControl(), options['changelog-tm'], 'textmap');
  }
  if (options['changelog-ex']) {
    await createChangelog(getWuwaControl(), options['changelog-ex'], 'excel');
  }
  if (options['excel-scalars']) {
    await doImportExcelScalars(getWuwaControl());
  }

  await closeKnex();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await importWuwaFilesCli();
}
