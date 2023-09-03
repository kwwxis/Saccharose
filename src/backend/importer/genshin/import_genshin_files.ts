import '../../loadenv';
import { pathToFileURL } from 'url';
import commandLineArgs, { OptionDefinition as ArgsOptionDefinition } from 'command-line-args';
import commandLineUsage, { OptionDefinition as UsageOptionDefinition } from 'command-line-usage';
import chalk from 'chalk';
import { getGenshinDataFilePath } from '../../loadenv';
import { getGenshinControl } from '../../domain/genshin/genshinControl';
import { closeKnex } from '../../util/db';
import { importNormalize, importPlainTextMap } from '../util/import_file_util';
import { importGcgSkill } from './module.gcg-skill';
import { importVoice } from './module.voice';
import { importTranslateSchema, translateExcel } from './module.translate-schema';
import { importFetters } from './module.fetters';
import { maximizeImages } from './module.maximize-images';
import { importSearchIndex } from './module.search-index';
import { importMakeExcels } from './module.make-excels';

export async function importGenshinFilesCli() {
  const optionDefinitions: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
    {name: 'normalize', type: Boolean, description: 'Normalizes the JSON files.'},
    {name: 'plaintext', type: Boolean, description: 'Creates the PlainTextMap files.'},
    {name: 'index', type: Boolean, description: 'Creates the index files for PlainTextMap.'},
    {name: 'voice', type: Boolean, description: 'Creates the normalized voice items file.'},
    {name: 'gcg-skill', type: Boolean, description: 'Creates file for GCG skill data'},
    {name: 'fetters', type: Boolean, description: 'Creates file for character fetters data'},
    {name: 'make-excels', type: Boolean, description: 'Creates some of the excels that are no longer updated by the game client'},
    {name: 'translate-schema', type: Boolean, description: 'Creates the SchemaTranslation file.'},
    {name: 'translate-excel', type: String, description: 'Translate excel to output directory. Requires translate-schema to be completed first.'},
    {name: 'maximize-images', type: Boolean, description: 'Compares images with duplicate names to choose the image with the largest size.'},
    {name: 'help', type: Boolean, description: 'Display this usage guide.'},
  ];

  let options: commandLineArgs.CommandLineOptions;
  try {
    options = commandLineArgs(optionDefinitions);
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
        header: 'Genshin Data Files Importer',
        content: 'Imports Genshin Data json into other supporting files.'
      },
      {
        header: 'Options',
        optionList: optionDefinitions
      }
    ])
    console.log(usage);
    return;
  }

  if (options.normalize) {
    await importNormalize(getGenshinDataFilePath('./ExcelBinOutput'), ['ProudSkillExcelConfigData.json']);
  }
  if (options.plaintext) {
    const ctrl = getGenshinControl();
    await importPlainTextMap(ctrl, getGenshinDataFilePath);
  }
  if (options.index) {
    await importSearchIndex();
  }
  if (options.voice) {
    await importVoice();
  }
  if (options['gcg-skill']) {
    await importGcgSkill();
  }
  if (options.fetters) {
    await importFetters();
  }
  if (options['translate-schema']) {
    await importTranslateSchema();
  }
  if (options['translate-excel']) {
    await translateExcel(options['translate-excel']);
  }
  if (options['maximize-images']) {
    await maximizeImages();
  }
  if (options['make-excels']) {
    await importMakeExcels();
  }

  await closeKnex();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await importGenshinFilesCli();
}