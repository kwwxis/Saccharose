import '../../loadenv';
import { AvatarExcelConfigData, FetterExcelConfigData, LangCode } from '../../../shared/types';
import { Control, getControl, normText } from '../script_util';
import { processFetterConds } from './fetterConds';
import { getTextMapItem, loadEnglishTextMap, loadTextMaps } from '../textmap';
import util from 'util';
import { closeKnex } from '../../util/db';
import { cleanEmpty, resolveObjectPath } from '../../../shared/util/arrayUtil';

// character
// name -> _s,_t

// title -> _s,_t
// subtitle
// file -> _male,_female
// language -> _s,_t
// tx -> _s,_t
// rm -> _s,_t
//

export class CharacterFetters {
  avatar: AvatarExcelConfigData = null;
  storyFetters: FetterExcelConfigData[] = [];
  combatFetters: FetterExcelConfigData[] = [];
}

export type CharacterFettersByAvatar = {[avatarId: number]: CharacterFetters};

export async function fetchCharacterFetters(ctrl: Control): Promise<CharacterFettersByAvatar> {
  let fetters: FetterExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/FettersExcelConfigData.json');
  let fettersByAvatar: CharacterFettersByAvatar = {};

  for (let fetter of fetters) {
    if (!fettersByAvatar[fetter.AvatarId]) {
      fettersByAvatar[fetter.AvatarId] = new CharacterFetters();
    }
    let agg = fettersByAvatar[fetter.AvatarId];
    if (!agg.avatar && fetter.Avatar) {
      agg.avatar = fetter.Avatar;
    }
    if (fetter.Type === 1) {
      agg.storyFetters.push(fetter);
    }
    if (fetter.Type === 2) {
      agg.combatFetters.push(fetter);
    }
    fetter.VoiceTitleText = normText(fetter.VoiceTitleText, ctrl.outputLangCode);
    fetter.VoiceFileTextText = normText(fetter.VoiceFileTextText, ctrl.outputLangCode);
    fetter.VoiceTitleLockedText = normText(fetter.VoiceTitleLockedText, ctrl.outputLangCode);

    fetter.MappedTips = fetter.Tips.map(tip => getTextMapItem(ctrl.outputLangCode, tip)).filter(x => !!x);
    await processFetterConds(ctrl, fetter, 'OpenConds');
  }

  return fettersByAvatar;
}

export async function fetchCharacterFettersByAvatarId(ctrl: Control, avatarId: number): Promise<CharacterFetters> {
  let fettersByAvatar = await fetchCharacterFetters(ctrl);
  return fettersByAvatar[avatarId];
}

export async function fetchCharacterFettersByAvatarName(ctrl: Control, avatarName: string): Promise<CharacterFetters> {
  let avatarNameNorm = avatarName.replaceAll(/_/g, ' ').toLowerCase().trim();
  let fettersByAvatar = await fetchCharacterFetters(ctrl);
  return Object.values(fettersByAvatar).find(x => x.avatar.NameText.toLowerCase() == avatarNameNorm);
}

if (require.main === module) {
  (async () => {
    await loadEnglishTextMap();
    const ctrl = getControl();
    let res = await fetchCharacterFettersByAvatarName(ctrl, 'nahida');

    res = cleanEmpty(res);
    resolveObjectPath(res, 'storyFetters[#EVERY].Avatar', true);
    resolveObjectPath(res, 'combatFetters[#EVERY].Avatar', true);
    console.log(util.inspect(res, false, null, true));

    await closeKnex();
  })();
}