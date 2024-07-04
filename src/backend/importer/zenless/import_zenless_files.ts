// noinspection DuplicatedCode

import '../../loadenv.ts';
import { pathToFileURL } from 'url';
import commandLineArgs, { OptionDefinition as ArgsOptionDefinition } from 'command-line-args';
import commandLineUsage, { OptionDefinition as UsageOptionDefinition } from 'command-line-usage';
import chalk from 'chalk';
import { getWuwaDataFilePath, getZenlessDataFilePath } from '../../loadenv.ts';
import { closeKnex } from '../../util/db.ts';
import { importNormalize, importPlainTextMap } from '../util/import_file_util.ts';
import { getZenlessControl } from '../../domain/zenless/zenlessControl.ts';
import fs from 'fs';

export async function importZenlessFilesCli() {
  const options_beforeDb: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
    {name: 'normalize', type: Boolean, description: 'Normalizes the JSON files.'},
    {name: 'plaintext', type: Boolean, description: 'Creates the PlainTextMap files.'},
  ];

  const options_afterDb: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
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
        header: 'Zenless Zone Zero Data Files Importer',
        content: 'Imports Zenless Zone Zero Data json into other supporting files.'
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
    const textMapCHS = getWuwaDataFilePath('./TextMap/TextMapTemplateTb.json');
    const textMapCHT = getWuwaDataFilePath('./TextMap/TextMap_CHT.json');
    const textMapDE = getWuwaDataFilePath('./TextMap/TextMap_DE.json');
    const textMapEN = getWuwaDataFilePath('./TextMap/TextMap_EN.json');
    const textMapES = getWuwaDataFilePath('./TextMap/TextMap_ES.json');
    const textMapFR = getWuwaDataFilePath('./TextMap/TextMap_FR.json');
    const textMapID = getWuwaDataFilePath('./TextMap/TextMap_ID.json');
    const textMapJA = getWuwaDataFilePath('./TextMap/TextMap_JA.json');
    const textMapKO = getWuwaDataFilePath('./TextMap/TextMap_KO.json');
    const textMapPT = getWuwaDataFilePath('./TextMap/TextMap_PT.json');
    const textMapRU = getWuwaDataFilePath('./TextMap/TextMap_RU.json');
    const textMapTH = getWuwaDataFilePath('./TextMap/TextMap_TH.json');
    const textMapVI = getWuwaDataFilePath('./TextMap/TextMap_VI.json');

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

    // await importNormalize(getZenlessDataFilePath('./FileCfg'), []);
  }
  if (options.plaintext) {
    const ctrl = getZenlessControl();
    await importPlainTextMap(ctrl, getZenlessDataFilePath);
  }

  await closeKnex();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await importZenlessFilesCli();
}
