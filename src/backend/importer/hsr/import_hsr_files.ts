// noinspection DuplicatedCode

import '../../loadenv.ts';
import { pathToFileURL } from 'url';
import commandLineArgs, { OptionDefinition as ArgsOptionDefinition } from 'command-line-args';
import commandLineUsage, { OptionDefinition as UsageOptionDefinition } from 'command-line-usage';
import chalk from 'chalk';
import { getStarRailDataFilePath } from '../../loadenv.ts';
import { closeKnex } from '../../util/db.ts';
import { importNormalize, importPlainTextMap } from '../util/import_file_util.ts';
import fs from 'fs';
import { getStarRailControl, loadStarRailVoiceItems } from '../../domain/hsr/starRailControl.ts';
import { fetchVoiceAtlases } from '../../domain/hsr/character/fetchVoiceAtlas.ts';

async function importVoiceOvers() {
  const outDir = process.env.HSR_DATA_ROOT;
  await loadStarRailVoiceItems();

  const ctrl = getStarRailControl();
  const voiceAtlases = await fetchVoiceAtlases(ctrl, true);

  fs.writeFileSync(outDir + '/VoiceOvers.json', JSON.stringify(voiceAtlases, null, 2));
  console.log(chalk.blue('Done. Output written to: ' + outDir + '/VoiceOvers.json'));
}

export async function importHsrFilesCli() {
  const optionDefinitions: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
    {name: 'normalize', type: Boolean, description: 'Normalizes the JSON files.'},
    {name: 'plaintext', type: Boolean, description: 'Creates the PlainTextMap files.'},
    {name: 'voice-overs', type: Boolean, description: 'Creates the VoiceOvers file.'},
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
        header: 'Star Rail Data Files Importer',
        content: 'Imports Star Rail Data json into other supporting files.'
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
    const textMapCN = getStarRailDataFilePath('./TextMap/TextMapCN.json');
    if (fs.existsSync(textMapCN)) {
      fs.renameSync(textMapCN, getStarRailDataFilePath('./TextMap/TextMapCHS.json'));
      console.log('Moved TextMapCN.json to TextMapCHS.json');
    }
    await importNormalize(getStarRailDataFilePath('./ExcelOutput'), [], true);
  }
  if (options['voice-overs']) {
    await importVoiceOvers();
  }
  if (options.plaintext) {
    const ctrl = getStarRailControl();
    await importPlainTextMap(ctrl, getStarRailDataFilePath);
  }

  await closeKnex();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await importHsrFilesCli();
}
