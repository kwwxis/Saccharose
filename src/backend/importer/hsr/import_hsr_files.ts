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
    {name: 'index-images', type: Boolean, description: 'Creates index for asset images. ' +
        'Must load all wanted Texture2D images into the EXT_HSR_IMAGES directory first though.'},
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
        header: 'Star Rail Data Files Importer',
        content: 'Imports Star Rail Data json into other supporting files.'
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
    await starRailNormalize();
  }
  if (options['voice-overs']) {
    await importVoiceOvers();
  }
  if (options['index-images']) {
    await indexStarRailImages(dryRun);
  }
  if (options.plaintext) {
    const ctrl = getStarRailControl();
    await importPlainTextMap(ctrl, getStarRailDataFilePath);
  }
  if (options['changelog']) {
    await createChangelog(ENV.HSR_CHANGELOGS, ENV.HSR_ARCHIVES, starRailSchema, StarRailVersions, options['changelog']);
  }

  await closeKnex();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await importHsrFilesCli();
}
