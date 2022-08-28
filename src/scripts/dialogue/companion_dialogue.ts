import '../../setup';
import { closeKnex } from '@db';
import { grep, nameNormMap } from '@/scripts/script_util';

export async function fetchCompanionDialogueTalkIds(): Promise<{[charName: string]: number}> {
  const grepResult = await grep('QuestDialogue/HomeWorld/', './ExcelBinOutput/TalkExcelConfigData.json');
  let charToTalkId: {[charName: string]: number} = {};
  for (let item of grepResult) {
    let substr = item.split('HomeWorld/')[1];
    let parts = substr.split('/');
    let char = parts[0].split('_')[0];
    let talkId = parts[1].slice(1);
    if (nameNormMap.hasOwnProperty(char.toLowerCase())) {
      char = nameNormMap[char.toLowerCase()];
    }
    if (!charToTalkId.hasOwnProperty(char)) {
      charToTalkId[char] = parseInt(talkId); // only get first talk id, rest are next-talks
    } else {
      if (char === 'Raiden Shogun' && !charToTalkId.hasOwnProperty('Raiden Ei')) {
        charToTalkId['Raiden Ei'] = parseInt(talkId);
      }
    }
  }
  return charToTalkId;
}

if (require.main === module) {
  (async () => {
    console.log(await fetchCompanionDialogueTalkIds());
    closeKnex();
  })();
}