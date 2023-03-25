import '../loadenv';
import fs from 'fs';
import {promises as fsp} from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import commandLineArgs, { OptionDefinition as ArgsOptionDefinition } from 'command-line-args';
import commandLineUsage, { OptionDefinition as UsageOptionDefinition } from 'command-line-usage';
import chalk from 'chalk';
import { getGenshinDataFilePath } from '../loadenv';
import { LANG_CODES } from '../../shared/types/dialogue-types';
import { clearFullTextMap, getFullTextMap, loadEnglishTextMap, loadTextMaps } from '../scripts/textmap';
import { getControl, normText } from '../scripts/script_util';
import { ReadableView } from '../../shared/types/readable-types';
import { closeKnex } from '../util/db';

async function importNormalize() {
  const jsonDir = getGenshinDataFilePath('./ExcelBinOutput');
  const jsonsInDir = (await fsp.readdir(jsonDir)).filter(file => path.extname(file) === '.json');
  console.log('JSON DIR:', jsonDir);

  let skip = ['ProudSkillExcelConfigData.json'];
  let numChanged: number = 0;

  for (let file of jsonsInDir) {
    if (skip.includes(file)) {
      continue;
    }

    const filePath = path.join(jsonDir, file);
    process.stdout.write(chalk.bold('Processing: ' + filePath));

    let fileData = await fsp.readFile(filePath, 'utf8');

    // Convert primitive arrays to be single-line.
    let newFileData = fileData.replace(/\[(\s*(\d+|\d+\.\d+|"[^"]+"|true|false),?\s*)*]/g, fm => {
      let s = fm.slice(1, -1).split(',').map(s => s.trim()).join(', ');
      return s ? '[ ' + s + ' ]' : '[]';
    });

    if (newFileData !== fileData) {
      await fsp.writeFile(filePath, newFileData, 'utf8');
      console.log(chalk.blue(' (modified)'));
      numChanged++;
    } else {
      console.log(chalk.gray(' (unchanged)'));
    }
  }

  console.log(chalk.blue(`Done, modified ${numChanged} files.`));
}

async function importVoice() {
  const outDir = process.env.GENSHIN_DATA_ROOT;
  const jsonDir = getGenshinDataFilePath('./BinOutput/Voice/Items');

  type VoiceOver = {fileName: string, gender?: 'M'|'F'};
  const combined: {[id: string]: VoiceOver[]} = {};

  const jsonsInDir = fs.readdirSync(jsonDir).filter(file => path.extname(file) === '.json');
  const unknownTriggers: Set<string> = new Set();

  jsonsInDir.forEach(file => {
    const fileData = fs.readFileSync(path.join(jsonDir, file), 'utf8');
    const json: {[guid: string]: any} = JSON.parse(fileData.toString());

    for (let voiceItem of Object.values(json)) {
      if (!voiceItem.gameTriggerArgs || !voiceItem._sourceNames) {
        continue;
      }

      let key: string;

      if (voiceItem._gameTrigger === 'Dialog') {
        key = 'Dialog_' + voiceItem.gameTriggerArgs;
      } else if (voiceItem._gameTrigger === 'DungeonReminder') {
        key = 'Reminder_' + voiceItem.gameTriggerArgs;
      } else if (voiceItem._gameTrigger === 'Fetter') {
        key = 'Fetter_' + voiceItem.gameTriggerArgs;
      } else if (voiceItem._gameTrigger === 'AnimatorEvent') {
        key = 'AnimatorEvent_' + voiceItem.gameTriggerArgs;
      } else if (voiceItem._gameTrigger === 'JoinTeam') {
        key = 'JoinTeam_' + voiceItem.gameTriggerArgs;
      } else if (voiceItem._gameTrigger === 'WeatherMonologue') {
        key = 'WeatherMonologue_' + voiceItem.gameTriggerArgs;
      } else if (voiceItem._gameTrigger === 'Card') {
        key = 'Card_' + voiceItem.gameTriggerArgs;
      } else {
        unknownTriggers.add(voiceItem._gameTrigger);
        continue;
      }

      combined[key] = [];

      for (let voiceSource of voiceItem._sourceNames) {
        let fileName: string = voiceSource.sourceFileName.split('\\').pop().toLowerCase().replace(/_/g, ' ').replace('.wem', '.ogg');
        let gender: number = voiceSource.gender;
        let voiceSourceNorm: VoiceOver = {fileName};
        if (gender === 1) {
          voiceSourceNorm.gender = 'F';
        } else  if (gender === 2) {
          voiceSourceNorm.gender = 'M';
        }
        let alreadyExisting = combined[key].find(x => x.fileName === voiceSourceNorm.fileName);
        if (alreadyExisting) {
          // Sometimes miHoYo adds duplicates like:
          //   { sourceFileName: 'VO_AQ\VO_nahida\vo_XMAQ305_13_nahida_16.wem', rate: 1.0, avatarName: 'Switch_hero', emotion: '', gender: 2 }
          //   { sourceFileName: 'VO_AQ\VO_nahida\vo_XMAQ305_13_nahida_16.wem', rate: 1.0, avatarName: 'Switch_heroine', emotion: '', gender: 1 }
          // where the only difference is the "gender"/"avatarName" property, but they use the same file.
          // In which case we want to only have one of them and remove the gender.
          if (voiceSourceNorm.gender && alreadyExisting.gender) {
            delete alreadyExisting.gender;
          }
          continue;
        }
        combined[key].push(voiceSourceNorm);
      }
    }
  });

  if (unknownTriggers.size) {
    console.log(chalk.red('Unknown game triggers:', unknownTriggers));
  }
  console.log(chalk.blue('Done. Output written to: ' + outDir + '/voiceItemsNormalized.json'));
  fs.writeFileSync(outDir + '/voiceItemsNormalized.json', JSON.stringify(combined, null, 2));
}

async function importPlainTextMap() {
  if (!fs.existsSync(getGenshinDataFilePath('./TextMap/Plain/'))) {
    fs.mkdirSync(getGenshinDataFilePath('./TextMap/Plain/'));
  }

  for (let langCode of LANG_CODES) {
    if (langCode === 'CH')
      continue;
    await loadTextMaps([ langCode ], false);

    let textmap = getFullTextMap(langCode);

    console.log(chalk.bold.underline('  Normalizing TextMap for ' + langCode));
    let hashList = [];
    let textList = [];

    for (let [hash, text] of Object.entries(textmap)) {
      hashList.push(hash);
      textList.push(normText(text, langCode, true, true).replaceAll(/\r?\n/g, '\\n'));
    }

    console.log('  Writing to PlainTextMap_Text.dat');
    fs.writeFileSync(getGenshinDataFilePath('./TextMap/Plain/PlainTextMap' + langCode + '_Text.dat'), textList.join('\n'), 'utf8');
    console.log('  Writing to PlainTextMap_Hash.dat');
    fs.writeFileSync(getGenshinDataFilePath('./TextMap/Plain/PlainTextMap' + langCode + '_Hash.dat'), hashList.join('\n'), 'utf8');

    textmap = null;

    clearFullTextMap(langCode);
    console.log(chalk.gray('----------'));
  }
  console.log(chalk.blue('Done'));
}

async function importIndex() {
  if (!fs.existsSync(getGenshinDataFilePath('./TextMap/Index/'))) {
    fs.mkdirSync(getGenshinDataFilePath('./TextMap/Index/'));
  }

  await loadEnglishTextMap();
  const ctrl = getControl();

  const writeOutput = (file: string, data: any) => {
    fs.writeFileSync(getGenshinDataFilePath(`./TextMap/Index/TextIndex_${file}.json`), JSON.stringify(data, null, 2), 'utf8');
    console.log(chalk.blue(' (done)'));
  };

  {
    process.stdout.write(chalk.bold('Generating readable index...'));
    const archive = await ctrl.selectReadableArchiveView();
    const readableList: ReadableView[] = [
      ...archive.Artifacts,
      ...archive.Weapons,
      ...archive.Materials,
      ...Object.values(archive.BookCollections).flatMap(bookSuit => bookSuit.Books),
    ];
    const readableIndex: { [viewId: number]: number } = {};

    for (let view of readableList) {
      readableIndex[view.TitleTextMapHash] = view.Id;
    }
    writeOutput('Readable', readableIndex);
  }
  {
    process.stdout.write(chalk.bold('Generating material index...'));
    const materialList = await ctrl.selectAllMaterialExcelConfigData({ LoadRelations: false, LoadSourceData: false });
    const materialIndex: { [id: number]: number } = {};

    for (let material of materialList) {
      materialIndex[material.NameTextMapHash] = material.Id;
      materialIndex[material.DescTextMapHash] = material.Id;
    }
    writeOutput('Material', materialIndex);
  }
  {
    process.stdout.write(chalk.bold('Generating furniture index...'));
    const furnitureList = await ctrl.selectAllFurniture();
    const furnitureIndex: { [id: number]: number } = {};

    for (let furniture of furnitureList) {
      furnitureIndex[furniture.NameTextMapHash] = furniture.Id;
      furnitureIndex[furniture.DescTextMapHash] = furniture.Id;
    }
    writeOutput('Furniture', furnitureIndex);
  }
  {
    process.stdout.write(chalk.bold('Generating furniture index...'));
    const furnitureSuiteList = await ctrl.selectAllFurnitureSuite();
    const furnitureSuiteIndex: { [id: number]: number } = {};

    for (let furniture of furnitureSuiteList) {
      furnitureSuiteIndex[furniture.SuiteNameTextMapHash] = furniture.SuiteId;
      furnitureSuiteIndex[furniture.SuiteDescTextMapHash] = furniture.SuiteId;
    }
    writeOutput('FurnitureSuite', furnitureSuiteIndex);
  }
  {
    process.stdout.write(chalk.bold('Generating weapon index...'));
    const weaponList = await ctrl.selectAllWeapons();
    const weaponIndex: { [id: number]: number } = {};

    for (let weapon of weaponList) {
      weaponIndex[weapon.NameTextMapHash] = weapon.Id;
      weaponIndex[weapon.DescTextMapHash] = weapon.Id;
    }
    writeOutput('Weapon', weaponIndex);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const optionDefinitions: (ArgsOptionDefinition & UsageOptionDefinition)[] = [
      {name: 'normalize', type: Boolean, description: 'Normalizes the JSON files.'},
      {name: 'plaintext', type: Boolean, description: 'Creates the PlainTextMap files.'},
      {name: 'index', type: Boolean, description: 'Creates the index files for PlainTextMap.'},
      {name: 'voice', type: Boolean, description: 'Creates the normalized voice items file.'},
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
      await importNormalize();
    }
    if (options.plaintext) {
      await importPlainTextMap();
    }
    if (options.index) {
      await importIndex();
    }
    if (options.voice) {
      await importVoice();
    }

    await closeKnex();
  })();
}