import { AbstractControl } from '../../domain/abstract/abstractControl.ts';
import fs, { promises as fsp } from 'fs';
import { LANG_CODES } from '../../../shared/types/lang-types.ts';
import { getTextMapRelPath } from '../../loadenv.ts';
import chalk from 'chalk';
import { EM_DASH, EN_DASH, NormTextOptions } from '../../domain/abstract/genericNormalizers.ts';

export async function importPlainTextMap(ctrl: AbstractControl, getDataFilePath: (relPath: string) => string) {
  if (!fs.existsSync(getDataFilePath('./TextMap/Plain/'))) {
    fs.mkdirSync(getDataFilePath('./TextMap/Plain/'));
  }

  for (let langCode of LANG_CODES) {
    if (langCode === 'CH')
      continue;

    try {
      let textmap: {
        [hash: string]: string
      } = await fsp.readFile(getDataFilePath(getTextMapRelPath(langCode)), { encoding: 'utf8' }).then(data => {
        return Object.freeze(JSON.parse(data));
      });

      console.log(chalk.bold.underline('Creating PlainTextMap for ' + langCode));
      let hashList: string[] = []; // entry format: "<hash>" or "<hash>,<type>"
      let textList: string[] = [];

      for (let [hash, text] of Object.entries(textmap)) {
        hash = hash.replaceAll(/\r?\n/g, '');

        hashList.push(hash + ',raw');
        textList.push(text.replaceAll(/\r?\n/g, '\\n'));

        let variations: NormTextOptions[] = [
          { decolor: true, plaintext: true, plaintextMcMode: 'both' },
        ];

        if (text.includes('{F#') || text.includes('{M#')) {
          variations.push({ decolor: true, plaintext: true, plaintextMcMode: 'male' });
          variations.push({ decolor: true, plaintext: true, plaintextMcMode: 'female' });
        }

        const addSingleVariation = (variation: NormTextOptions) => {
          variations.push(...variations.map(v => Object.assign({}, v, variation)));
        };

        if (text.includes(EM_DASH) || text.includes(EN_DASH)) {
          addSingleVariation({ forceFancyDash: true });
        }

        for (let variation of variations) {
          hashList.push(hash);
          textList.push(ctrl.normText(text, langCode, variation).replaceAll(/\r?\n/g, '\\n'));
        }
      }

      console.log(`  Writing to PlainTextMap${langCode}_Text.dat`);
      fs.writeFileSync(getDataFilePath('./TextMap/Plain/PlainTextMap' + langCode + '_Text.dat'), textList.join('\n'), 'utf8');
      console.log(`  Writing to PlainTextMap${langCode}_Hash.dat`);
      fs.writeFileSync(getDataFilePath('./TextMap/Plain/PlainTextMap' + langCode + '_Hash.dat'), hashList.join('\n'), 'utf8');

      textmap = null;
    } catch (e) {
      console.log(chalk.yellow('Could not process TextMap for ' + langCode + ' (may not exist) -- ' + getDataFilePath(getTextMapRelPath(langCode))));
      if (!String(e).includes('no such file or directory')) {
        console.error(e);
      }
    }
    console.log(chalk.gray('----------'));
  }
  console.log(chalk.blue('Done'));
}
