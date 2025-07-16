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
import { WuwaVersions } from '../../../shared/types/game-versions.ts';
import { wuwaSchema } from './wuwa.schema.ts';

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
    {name: 'index-images', type: Boolean, description: 'Creates index for asset images. ' +
        'Must load all wanted Texture2D images into the EXT_WUWA_IMAGES directory first though.'},
  ];

  const options_afterDb: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
    {name: 'voice-overs', type: Boolean, description: 'Creates the VoiceOvers file.'},
    {name: 'changelog', type: String, typeLabel: '<version>', description: 'Creates changelog between the provided version and the version before it.'},
  ];

  const options_util: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
    {name: 'help', type: Boolean, description: 'Display this usage guide.'},
    {name: 'dry-run', type: Boolean},
  ];

  let options: commandLineArgs.CommandLineOptions;
  try {
    options = commandLineArgs([... options_beforeDb, ... options_afterDb, ... options_util]);
  } catch (e) {
    if (typeof e === 'object' && e.name === 'UNKNOWN_OPTION') {
      console.warn(chalk.red('\nUnknown option: ' + e.optionName));
    } else {
      console.error(chalk.red('\n' + e?.message || e));
    }
    options = { help: true };
  }

  let dryRun: boolean = false;
  if (options['dry']) {
    dryRun = true;
    delete options['dry'];
  }
  if (options['dry-run']) {
    dryRun = true;
    delete options['dry-run'];
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
    const textMapDE = getWuwaDataFilePath('./TextMap/de/MultiText.json');
    const textMapEN = getWuwaDataFilePath('./TextMap/en/MultiText.json');
    const textMapES = getWuwaDataFilePath('./TextMap/es/MultiText.json');
    const textMapFR = getWuwaDataFilePath('./TextMap/fr/MultiText.json');
    const textMapID = getWuwaDataFilePath('./TextMap/id/MultiText.json');
    const textMapJA = getWuwaDataFilePath('./TextMap/ja/MultiText.json');
    const textMapKO = getWuwaDataFilePath('./TextMap/ko/MultiText.json');
    const textMapPT = getWuwaDataFilePath('./TextMap/pt/MultiText.json');
    const textMapRU = getWuwaDataFilePath('./TextMap/ru/MultiText.json');
    const textMapTH = getWuwaDataFilePath('./TextMap/th/MultiText.json');
    const textMapVI = getWuwaDataFilePath('./TextMap/vi/MultiText.json');
    const textMapCHS = getWuwaDataFilePath('./TextMap/zh-Hans/MultiText.json');
    const textMapCHT = getWuwaDataFilePath('./TextMap/zh-Hant/MultiText.json');

    fs.copyFileSync(textMapDE, getWuwaDataFilePath('./TextMap/TextMapDE.json'));
    fs.copyFileSync(textMapEN, getWuwaDataFilePath('./TextMap/TextMapEN.json'));
    fs.copyFileSync(textMapES, getWuwaDataFilePath('./TextMap/TextMapES.json'));
    fs.copyFileSync(textMapFR, getWuwaDataFilePath('./TextMap/TextMapFR.json'));
    fs.copyFileSync(textMapID, getWuwaDataFilePath('./TextMap/TextMapID.json'));
    fs.copyFileSync(textMapJA, getWuwaDataFilePath('./TextMap/TextMapJP.json'));

    fs.copyFileSync(textMapKO, getWuwaDataFilePath('./TextMap/TextMapKR.json'));
    fs.copyFileSync(textMapPT, getWuwaDataFilePath('./TextMap/TextMapPT.json'));
    fs.copyFileSync(textMapRU, getWuwaDataFilePath('./TextMap/TextMapRU.json'));
    fs.copyFileSync(textMapTH, getWuwaDataFilePath('./TextMap/TextMapTH.json'));
    fs.copyFileSync(textMapVI, getWuwaDataFilePath('./TextMap/TextMapVI.json'));
    fs.copyFileSync(textMapCHS, getWuwaDataFilePath('./TextMap/TextMapCHS.json'));
    fs.copyFileSync(textMapCHT, getWuwaDataFilePath('./TextMap/TextMapCHT.json'));

    await importNormalize(getWuwaDataFilePath('./ConfigDB'), ['GmOrderList.json'], 'wuwa');
  }
  if (options['voice-overs']) {
    await importVoiceOvers();
  }
  if (options['index-images']) {
    await indexWuwaImages(dryRun);
  }
  if (options.plaintext) {
    const ctrl = getWuwaControl();
    await importPlainTextMap(ctrl, getWuwaDataFilePath);
  }
  if (options['changelog']) {
    await createChangelog(ENV.WUWA_CHANGELOGS, ENV.WUWA_ARCHIVES, wuwaSchema, WuwaVersions, options['changelog']);
  }

  await closeKnex();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await importWuwaFilesCli();
}
