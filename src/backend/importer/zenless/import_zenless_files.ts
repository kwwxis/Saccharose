// noinspection DuplicatedCode

import '../../loadenv.ts';
import { pathToFileURL } from 'url';
import commandLineArgs, { OptionDefinition as ArgsOptionDefinition } from 'command-line-args';
import commandLineUsage, { OptionDefinition as UsageOptionDefinition } from 'command-line-usage';
import chalk from 'chalk';
import { getZenlessDataFilePath } from '../../loadenv.ts';
import { closeKnex } from '../../util/db.ts';
import { importPlainTextMap } from '../util/import_file_util.ts';
import { getZenlessControl } from '../../domain/zenless/zenlessControl.ts';
import { generateDialogueNodes } from './module.dialogue-nodes.ts';
import { zenlessNormalize } from './module.normalize.ts';
import { createChangelog } from '../util/createChangelogUtil.ts';
import { ZenlessVersions } from '../../../shared/types/game-versions.ts';
import { zenlessSchema } from './zenless.schema.ts';
import { importTextMapChanges } from '../../domain/abstract/tmchanges.ts';

export async function importZenlessFilesCli() {
  const options_beforeDb: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
    {name: 'dialogue-nodes', type: Boolean, description: 'Creates dialogue nodes file.'},
    {name: 'normalize', type: Boolean, description: 'Normalizes the JSON files.'},
    {name: 'plaintext', type: Boolean, description: 'Creates the PlainTextMap files.'},
  ];

  const options_afterDb: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
    {name: 'changelog', type: String, typeLabel: '<version>', description: 'Creates changelog between the provided version and the version before it.'},
    {name: 'changelog-tmimport', type: String, typeLabel: '<version>', description: 'Imports textmap changelog into the database (changelog must be ran first).'},
  ];

  const options_util: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
    {name: 'help', type: Boolean, description: 'Display this usage guide.'},
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
    await zenlessNormalize();
  }
  if (options.plaintext) {
    const ctrl = getZenlessControl();
    await importPlainTextMap(ctrl, getZenlessDataFilePath);
  }
  if (options['dialogue-nodes']) {
    await generateDialogueNodes(getZenlessDataFilePath());
  }
  if (options['changelog']) {
    await createChangelog(ENV.ZENLESS_CHANGELOGS, ENV.ZENLESS_ARCHIVES, zenlessSchema, ZenlessVersions, options['changelog']);
  }
  if (options['changelog-tmimport']) {
    await importTextMapChanges(getZenlessControl(), options['changelog-tmimport']);
  }

  await closeKnex();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await importZenlessFilesCli();
}
