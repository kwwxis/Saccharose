import '../../loadenv';
import { closeKnex } from '../../util/db';
import { Control, getControl, grep } from '../script_util';
import { DialogueSectionResult, TalkConfigAccumulator } from './quest_generator';
import { talkConfigGenerate } from './basic_dialogue_generator';
import { loadTextMaps } from '../textmap';
import { cached } from '../../util/cache';

const nameNormMap = {
  ayaka: 'Kamisato Ayaka',
  kamisatoayaka: 'Kamisato Ayaka',
  qin: 'Jean',
  jean: 'Jean',
  lisa: 'Lisa',
  yelan: 'Yelan',
  shinobu: 'Kuki Shinobu',
  kukishinobu: 'Kuki Shinobu',
  barbara: 'Barbara',
  kaeya: 'Kaeya',
  diluc: 'Diluc',
  razor: 'Razor',
  ambor: 'Amber',
  amber: 'Amber',
  venti: 'Venti',
  xiangling: 'Xiangling',
  beidou: 'Beidou',
  xingqiu: 'Xingqiu',
  xiao: 'Xiao',
  ningguang: 'Ningguang',
  klee: 'Klee',
  zhongli: 'Zhongli',
  fischl: 'Fischl',
  bennett: 'Bennett',
  tartaglia: 'Tartaglia',
  noel: 'Noelle',
  noelle: 'Noelle',
  qiqi: 'Qiqi',
  chongyun: 'Chongyun',
  ganyu: 'Ganyu',
  albedo: 'Albedo',
  diona: 'Diona',
  mona: 'Mona',
  keqing: 'Keqing',
  sucrose: 'Sucrose',
  xinyan: 'Xinyan',
  rosaria: 'Rosaria',
  hutao: 'Hu Tao',
  kazuha: 'Kazuha',
  yanfei: 'Yanfei',
  yoimiya: 'Yoimiya',
  tohma: 'Thoma',
  thoma: 'Thoma',
  eula: 'Eula',
  shougun: 'Raiden Shogun',
  raidenshogun: 'Raiden Shogun',
  sayu: 'Sayu',
  kokomi: 'Kokomi',
  gorou: 'Gorou',
  sara: 'Kujou Sara',
  kujousara: 'Kujou Sara',
  itto: 'Arataki Itto',
  aratakiitto: 'Arataki Itto',
  yae: 'Yae Miko',
  yaemiko: 'Yae Miko',
  heizo: 'Shikanoin Heizou',
  shikanoinheizou: 'Shikanoin Heizou',
  aloy: 'Aloy',
  shenhe: 'Shenhe',
  yunjin: 'Yunjin',
  ayato: 'Kamisato Ayato',
  kamisatoayato: 'Kamisato Ayato',
  collei: 'Collei',
  dori: 'Dori',
  tighnari: 'Tighnari',
  paimon: 'Paimon'
};

export async function fetchCompanionDialogueTalkIds(): Promise<{[charName: string]: number[]}> {
  return cached('CompanionDialogueTalkIds', async () => {
    const grepResult = await grep('QuestDialogue/HomeWorld/', './ExcelBinOutput/TalkExcelConfigData.json');
    let charToTalkId: {[charName: string]: number[]} = {};
    for (let item of grepResult) {
      let substr = item.split('HomeWorld/')[1];
      let parts = substr.split('/');
      let char = parts[0].split('_')[0];
      let talkId = parts[1].slice(1);
      if (nameNormMap.hasOwnProperty(char.toLowerCase())) {
        char = nameNormMap[char.toLowerCase()];
      }

      if (!charToTalkId.hasOwnProperty(char)) {
        charToTalkId[char] = [parseInt(talkId)];
      } else {
        charToTalkId[char].push(parseInt(talkId));
      }
    }
    return charToTalkId;
  });
}

export async function fetchCompanionDialogue(ctrl: Control, charName: string): Promise<DialogueSectionResult[]> {
  return cached('CompanionDialogue_'+charName+'_'+ctrl.outputLangCode, async () => {
    let result: DialogueSectionResult[] = [];
    let talkIds = (await fetchCompanionDialogueTalkIds())[charName];
    if (!talkIds) {
      return [];
    }

    let acc = new TalkConfigAccumulator(ctrl);

    for (let talkConfigId of talkIds) {
      if (acc.fetchedTalkConfigIds.includes(talkConfigId)) {
        continue;
      }
      result.push(await talkConfigGenerate(ctrl, talkConfigId, null, acc));
    }

    return result;
  });
}

if (require.main === module) {
  (async () => {
    await loadTextMaps();
    console.log(await fetchCompanionDialogue(getControl(), 'Raiden Shogun'));
    await closeKnex();
  })();
}