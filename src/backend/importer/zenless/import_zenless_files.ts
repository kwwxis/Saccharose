// noinspection DuplicatedCode

import '../../loadenv.ts';
import { pathToFileURL } from 'url';
import commandLineArgs, { OptionDefinition as ArgsOptionDefinition } from 'command-line-args';
import commandLineUsage, { OptionDefinition as UsageOptionDefinition } from 'command-line-usage';
import chalk from 'chalk';
import { getZenlessDataFilePath } from '../../loadenv.ts';
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
    const textMapCHS = getZenlessDataFilePath('./TextMap/TextMapTemplateTb.json');
    const textMapCHT = getZenlessDataFilePath('./TextMap/TextMap_CHTTemplateTb.json');
    const textMapDE = getZenlessDataFilePath('./TextMap/TextMap_DETemplateTb.json');
    const textMapEN = getZenlessDataFilePath('./TextMap/TextMap_ENTemplateTb.json');
    const textMapES = getZenlessDataFilePath('./TextMap/TextMap_ESTemplateTb.json');
    const textMapFR = getZenlessDataFilePath('./TextMap/TextMap_FRTemplateTb.json');
    const textMapID = getZenlessDataFilePath('./TextMap/TextMap_IDTemplateTb.json');
    const textMapJA = getZenlessDataFilePath('./TextMap/TextMap_JATemplateTb.json');
    const textMapKO = getZenlessDataFilePath('./TextMap/TextMap_KOTemplateTb.json');
    const textMapPT = getZenlessDataFilePath('./TextMap/TextMap_PTTemplateTb.json');
    const textMapRU = getZenlessDataFilePath('./TextMap/TextMap_RUTemplateTb.json');
    const textMapTH = getZenlessDataFilePath('./TextMap/TextMap_THTemplateTb.json');
    const textMapVI = getZenlessDataFilePath('./TextMap/TextMap_VITemplateTb.json');

    fs.copyFileSync(textMapDE, getZenlessDataFilePath('./TextMap/TextMapDE.json'));
    fs.copyFileSync(textMapEN, getZenlessDataFilePath('./TextMap/TextMapEN.json'));
    fs.copyFileSync(textMapES, getZenlessDataFilePath('./TextMap/TextMapES.json'));
    fs.copyFileSync(textMapFR, getZenlessDataFilePath('./TextMap/TextMapFR.json'));
    fs.copyFileSync(textMapID, getZenlessDataFilePath('./TextMap/TextMapID.json'));
    fs.copyFileSync(textMapJA, getZenlessDataFilePath('./TextMap/TextMapJP.json'));
    fs.copyFileSync(textMapKO, getZenlessDataFilePath('./TextMap/TextMapKR.json'));
    fs.copyFileSync(textMapPT, getZenlessDataFilePath('./TextMap/TextMapPT.json'));
    fs.copyFileSync(textMapRU, getZenlessDataFilePath('./TextMap/TextMapRU.json'));
    fs.copyFileSync(textMapTH, getZenlessDataFilePath('./TextMap/TextMapTH.json'));
    fs.copyFileSync(textMapVI, getZenlessDataFilePath('./TextMap/TextMapVI.json'));
    fs.copyFileSync(textMapCHS, getZenlessDataFilePath('./TextMap/TextMapCHS.json'));
    fs.copyFileSync(textMapCHT, getZenlessDataFilePath('./TextMap/TextMapCHT.json'));

    await importNormalize(getZenlessDataFilePath('./FileCfg'), [], 'zenless', ['MonsterAITemplateTb.json']);
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
