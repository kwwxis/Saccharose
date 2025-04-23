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
import { generateDialogueNodes } from './module.dialogue-nodes.ts';

export async function importZenlessFilesCli() {
  const options_beforeDb: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
    {name: 'dialogue-nodes', type: Boolean, description: 'Creates dialogue nodes file.'},
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
    const infos = [
      {base: './TextMap/TextMapTemplateTb.json',      overwrite: './TextMap/TextMapOverwriteTemplateTb.json',      outfile: './TextMap/TextMapCHS.json'},
      {base: './TextMap/TextMap_CHTTemplateTb.json',  overwrite: './TextMap/TextMap_CHTOverwriteTemplateTb.json',  outfile: './TextMap/TextMapCHT.json'},
      {base: './TextMap/TextMap_DETemplateTb.json',   overwrite: './TextMap/TextMap_DEOverwriteTemplateTb.json',   outfile: './TextMap/TextMapDE.json'},
      {base: './TextMap/TextMap_ENTemplateTb.json',   overwrite: './TextMap/TextMap_ENOverwriteTemplateTb.json',   outfile: './TextMap/TextMapEN.json'},
      {base: './TextMap/TextMap_ESTemplateTb.json',   overwrite: './TextMap/TextMap_ESOverwriteTemplateTb.json',   outfile: './TextMap/TextMapES.json'},
      {base: './TextMap/TextMap_FRTemplateTb.json',   overwrite: './TextMap/TextMap_FROverwriteTemplateTb.json',   outfile: './TextMap/TextMapFR.json'},
      {base: './TextMap/TextMap_IDTemplateTb.json',   overwrite: './TextMap/TextMap_IDOverwriteTemplateTb.json',   outfile: './TextMap/TextMapID.json'},
      {base: './TextMap/TextMap_JATemplateTb.json',   overwrite: './TextMap/TextMap_JAOverwriteTemplateTb.json',   outfile: './TextMap/TextMapJP.json'},
      {base: './TextMap/TextMap_KOTemplateTb.json',   overwrite: './TextMap/TextMap_KOOverwriteTemplateTb.json',   outfile: './TextMap/TextMapKR.json'},
      {base: './TextMap/TextMap_PTTemplateTb.json',   overwrite: './TextMap/TextMap_PTOverwriteTemplateTb.json',   outfile: './TextMap/TextMapPT.json'},
      {base: './TextMap/TextMap_RUTemplateTb.json',   overwrite: './TextMap/TextMap_RUOverwriteTemplateTb.json',   outfile: './TextMap/TextMapRU.json'},
      {base: './TextMap/TextMap_THTemplateTb.json',   overwrite: './TextMap/TextMap_THOverwriteTemplateTb.json',   outfile: './TextMap/TextMapTH.json'},
      {base: './TextMap/TextMap_VITemplateTb.json',   overwrite: './TextMap/TextMap_VIOverwriteTemplateTb.json',   outfile: './TextMap/TextMapVI.json'},
    ];
    for (let info of infos) {
      const baseJson = JSON.parse(fs.readFileSync(getZenlessDataFilePath(info.base), {encoding: 'utf8'}));
      const overwriteJson = JSON.parse(fs.readFileSync(getZenlessDataFilePath(info.overwrite), {encoding: 'utf8'}));

      const finalJson = Object.assign({}, baseJson, overwriteJson);

      fs.writeFileSync(getZenlessDataFilePath(info.outfile), JSON.stringify(finalJson, null, 2), 'utf-8');
    }

    await importNormalize(getZenlessDataFilePath('./FileCfg'), [], 'zenless', ['MonsterAITemplateTb.json']);
  }
  if (options.plaintext) {
    const ctrl = getZenlessControl();
    await importPlainTextMap(ctrl, getZenlessDataFilePath);
  }
  if (options['dialogue-nodes']) {
    await generateDialogueNodes(getZenlessDataFilePath());
  }

  await closeKnex();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await importZenlessFilesCli();
}
