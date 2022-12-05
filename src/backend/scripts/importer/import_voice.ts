import '../../loadenv';
import config from '../../config';
import fs from 'fs';
import path from 'path';

// gender 2 - male traveler
// gender 1 - female traveler

const outDir = process.env.GENSHIN_DATA_ROOT;
const jsonDir = config.database.getGenshinDataFilePath('./BinOutput/Voice/Items');

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
        // Sometimes mihoyo accidentally adds duplicates like:
        //   { sourceFileName: 'VO_AQ\VO_nahida\vo_XMAQ305_13_nahida_16.wem', rate: 1.0, avatarName: 'Switch_hero', emotion: '', gender: 2 }
        //   { sourceFileName: 'VO_AQ\VO_nahida\vo_XMAQ305_13_nahida_16.wem', rate: 1.0, avatarName: 'Switch_heroine', emotion: '', gender: 1 }
        // where the only difference is the gender/avatarName. In which case we want to only have one of them and remove the gender.
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
  console.log('Unknown game triggers:', unknownTriggers);
}
fs.writeFileSync(outDir + '/voiceItemsNormalized.json', JSON.stringify(combined, null, 2));