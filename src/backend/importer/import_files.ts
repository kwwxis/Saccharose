import chalk from 'chalk';
import commandLineArgs, { OptionDefinition as ArgsOptionDefinition } from 'command-line-args';
import commandLineUsage, { OptionDefinition as UsageOptionDefinition } from 'command-line-usage';
import { pathToFileURL } from 'url';
import { isStringBlank } from '../../shared/util/stringUtil';
import { importGenshinFilesCli } from './genshin/import_genshin_files';
import { importHsrFilesCli } from './hsr/import_hsr_files';
import { importZenlessFilesCli } from './zenless/import_zenless_files';
import * as process from 'process';

async function importFilesCli() {
  const optionDefinitions: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
    {name: 'game', alias: 'g', type: String, description: 'One of "genshin", "hsr", or "zenless"', typeLabel: '<game>'},
    {name: 'help', alias: 'h', type: Boolean, description: 'Display this usage guide.'},
  ];

  let options: commandLineArgs.CommandLineOptions;
  try {
    options = commandLineArgs(optionDefinitions, {partial: true, stopAtFirstUnknown: false});
  } catch (e) {
    if (typeof e === 'object' && e.name === 'UNKNOWN_OPTION') {
      console.warn(chalk.red('\nUnknown option: ' + e.optionName));
    } else {
      console.error(chalk.red('\n' + e?.message || e));
    }
    options = { help: true };
  }

  if (isStringBlank(options['game']) && !options.help) {
    console.error(chalk.red('\nThe "game" option is required.'));
    options.help = true;
  }

  if (options.help && isStringBlank(options['game'])) {
    const usage = commandLineUsage([
      {
        header: 'Saccharose Files Importer',
        content: 'Imports game data json into other supporting files. More options will be available once a game is selected.'
      },
      {
        header: 'Options',
        optionList: optionDefinitions
      }
    ])
    console.log(usage);
    return;
  }

  let gameIndex = process.argv.findIndex(x => x.toLowerCase() === '--game' || x.toLowerCase() === '-g');
  if (gameIndex < 0) throw 'Implementation error';
  process.argv.splice(gameIndex, 2);

  switch (options['game']?.toLowerCase()) {
    case 'gi':
    case 'genshin':
    case 'genshinimpact':
    case 'genshin-impact':
      await importGenshinFilesCli();
      break;
    case 'hsr':
    case 'starrail':
    case 'star-rail':
    case 'honkaistarrail':
      await importHsrFilesCli();
      break;
    case 'zzz':
    case 'zenless':
    case 'zenlesszonezero':
      await importZenlessFilesCli();
      break;
    default:
      console.error(chalk.red('\nInvalid value for "game" option.\n'));
      return;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await importFilesCli();
}