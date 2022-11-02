// gender 2 - male traveler
// gender 1 - female traveler

import fs from 'fs';
import path from 'path';

const outDir = 'C:/Shared/';
const jsonDir = 'C:/Shared/git/Voice/Items';

const combined = {};

const jsonsInDir = fs.readdirSync(jsonDir).filter(file => path.extname(file) === '.json');
const unknownTriggers: Set<string> = new Set();

jsonsInDir.forEach(file => {
  const fileData = fs.readFileSync(path.join(jsonDir, file));
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
    } else {
      unknownTriggers.add(voiceItem._gameTrigger);
      continue;
    }

    combined[key] = [];

    for (let voiceSource of voiceItem._sourceNames) {
      let fileName = voiceSource.sourceFileName.split('\\').pop().toLowerCase().replace(/_/g, ' ').replace('.wem', '.ogg');
      let gender = voiceSource.gender;
      let voiceSourceNorm: any = {fileName};
      if (gender === 1) {
        voiceSourceNorm.gender = 'F';
      } else  if (gender === 2) {
        voiceSourceNorm.gender = 'M';
      }
      combined[key].push(voiceSourceNorm);
    }
  }
});

if (unknownTriggers.size) {
  console.log('Unknown game triggers:', unknownTriggers);
}
fs.writeFileSync(outDir + '/voiceItemsNormalized.json', JSON.stringify(combined, null, 2));