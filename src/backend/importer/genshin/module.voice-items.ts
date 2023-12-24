import { normalizeRawJson, SchemaTable } from '../import_db.ts';
import { getGenshinDataFilePath } from '../../loadenv.ts';
import { VoiceItem, VoiceItemArrayMap } from '../../../shared/types/lang-types.ts';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const VoiceSchema = <SchemaTable> {
  name: 'VoiceItems',
  columns: [],
  jsonFile: '',
  renameFields: {
    KMMBCJDNDNM: 'GameTrigger',
    JAOANONPLDI: 'GameTriggerArgs',
    IIFPKNOPNFI: 'PersonalConfig',
    EDNNCHGNMHO: 'SourceNames',
    EEFLLCGNDCG: 'SourceFileName',
    NJNEOOGNPKH: 'Gender',

    BFKCDJLLGNJ: 'GameTrigger',
    FMHLBONJKPJ: 'GameTriggerArgs',
    JPMLINEFNCM: 'PersonalConfig',
    OFEEIPOMNKD: 'SourceNames',
    CBGLAJNLFCB: 'SourceFileName',
    HCAIPGAELFP: 'Gender',

    BEHKGKMMAPD: 'GameTrigger',
    FFDHLEAFBLM: 'GameTriggerArgs',
    LFIFIPFFFKO: 'PersonalConfig',
    EIKJKDICKMJ: 'SourceNames',
    HLGOMILNFNK: 'SourceFileName',
    BBKIPNLMMCL: 'Gender',
  },
};

const voFileFirstTwo = (vo: VoiceItem) => vo.fileName.split(' ').slice(0, 2).join(' ');

const allSame = (a: string[]) => {
  if (!a.length) return true;
  let first = a[0];
  for (let str of a.slice(1)) {
    if (str !== first) {
      return false;
    }
  }
  return true;
}

export async function importVoiceItems() {
  const outDir = process.env.GENSHIN_DATA_ROOT;
  const jsonDir = getGenshinDataFilePath('./BinOutput/Voice/Items');

  const combined: VoiceItemArrayMap = {};

  const jsonsInDir = fs.readdirSync(jsonDir).filter(file => path.extname(file) === '.json');
  const unknownTriggers: Set<string> = new Set();

  jsonsInDir.forEach(file => {
    const fileData = fs.readFileSync(path.join(jsonDir, file), 'utf8');
    const json: { [guid: string]: any } = JSON.parse(fileData.toString());

    for (let voiceItem of Object.values(json)) {
      voiceItem = normalizeRawJson(voiceItem, VoiceSchema);

      if (!voiceItem.GameTriggerArgs || !voiceItem.SourceNames) {
        continue;
      }

      let key: string;

      if (voiceItem.GameTrigger === 'Dialog') {
        key = 'Dialog_' + voiceItem.GameTriggerArgs;
      } else if (voiceItem.GameTrigger === 'DungeonReminder') {
        key = 'Reminder_' + voiceItem.GameTriggerArgs;
      } else if (voiceItem.GameTrigger === 'Fetter') {
        key = 'Fetter_' + voiceItem.GameTriggerArgs;
      } else if (voiceItem.GameTrigger === 'AnimatorEvent') {
        key = 'AnimatorEvent_' + voiceItem.GameTriggerArgs;
      } else if (voiceItem.GameTrigger === 'JoinTeam') {
        key = 'JoinTeam_' + voiceItem.GameTriggerArgs;
      } else if (voiceItem.GameTrigger === 'WeatherMonologue') {
        key = 'WeatherMonologue_' + voiceItem.GameTriggerArgs;
      } else if (voiceItem.GameTrigger === 'Card') {
        key = 'Card_' + voiceItem.GameTriggerArgs;
      } else {
        unknownTriggers.add(voiceItem.GameTrigger);
        continue;
      }

      if (!combined[key]) {
        combined[key] = [];
      }

      for (let voiceSource of voiceItem.SourceNames) {
        let fileName: string = voiceSource.SourceFileName.split('\\').pop().toLowerCase().replace(/_/g, ' ').replace('.wem', '.ogg');
        let gender: number = voiceSource.Gender;
        let voiceSourceNorm: VoiceItem = { id: voiceItem.GameTriggerArgs, fileName };
        if (voiceItem.GameTrigger) {
          voiceSourceNorm.type = voiceItem.GameTrigger;
        }
        if (voiceSource.AvatarName) {
          voiceSourceNorm.avatar = voiceSource.AvatarName;
        }
        if (gender === 1) {
          voiceSourceNorm.gender = 'F';
          voiceSourceNorm.isGendered = true;
        } else if (gender === 2) {
          voiceSourceNorm.gender = 'M';
          voiceSourceNorm.isGendered = true;
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
            delete voiceSourceNorm.isGendered;
          }
          continue;
        }
        if (combined[key].length && voiceSourceNorm.type === 'Dialog' && voFileFirstTwo(combined[key][0]) !== voFileFirstTwo(voiceSourceNorm)) {
          console.warn('Got Voice Item conflict', combined[key], voiceSourceNorm);
          continue;
        }
        combined[key].push(voiceSourceNorm);
      }
    }
  });

  if (unknownTriggers.size) {
    console.log(chalk.red('Unknown game triggers:', unknownTriggers));
  }
  fs.writeFileSync(outDir + '/VoiceItems.json', JSON.stringify(combined, null, 2));
  console.log(chalk.blue('Done. Output written to: ' + outDir + '/VoiceItems.json'));
}