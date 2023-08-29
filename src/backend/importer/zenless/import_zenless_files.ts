import '../../loadenv';
import { pathToFileURL } from 'url';
import commandLineArgs, { OptionDefinition as ArgsOptionDefinition } from 'command-line-args';
import commandLineUsage, { OptionDefinition as UsageOptionDefinition } from 'command-line-usage';
import chalk from 'chalk';
import { getZenlessDataFilePath } from '../../loadenv';
import { closeKnex } from '../../util/db';
import { importNormalize, importPlainTextMap } from '../import_file_util';
import { getZenlessControl } from '../../domain/zenless/zenlessControl';
import { loadZenlessTextSupportingData } from '../../domain/zenless/zenlessText';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const optionDefinitions: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
      {name: 'normalize', type: Boolean, description: 'Normalizes the JSON files.'},
      {name: 'plaintext', type: Boolean, description: 'Creates the PlainTextMap files.'},
      {name: 'help', type: Boolean, description: 'Display this usage guide.'},
    ];

    const options = commandLineArgs(optionDefinitions);

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
          header: 'Options',
          optionList: optionDefinitions
        }
      ])
      console.log(usage);
      return;
    }

    if (options.normalize) {
      await importNormalize(getZenlessDataFilePath('./ExcelConfigData'), []);
    }
    if (options.plaintext) {
      const ctrl = getZenlessControl();
      await importPlainTextMap(ctrl, getZenlessDataFilePath);
    }

    await closeKnex();
  })();
}