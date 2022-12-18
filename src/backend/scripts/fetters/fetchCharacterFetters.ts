import '../../loadenv';
import { Control, getControl, normText } from '../script_util';
import { processFetterConds } from './fetterConds';
import { getTextMapItem, loadEnglishTextMap, loadTextMaps } from '../textmap';
import util from 'util';
import { closeKnex } from '../../util/db';
import { cleanEmpty, resolveObjectPath } from '../../../shared/util/arrayUtil';
import { CharacterFetters, CharacterFettersByAvatar, FetterExcelConfigData } from '../../../shared/types/fetter-types';
import { cached } from '../../util/cache';

export async function fetchCharacterFetters(ctrl: Control): Promise<CharacterFettersByAvatar> {
  return cached('CharacterFetters_' + ctrl.outputLangCode, async () => {
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
      fetter.VoiceFileText = normText(fetter.VoiceFileText, ctrl.outputLangCode);
      fetter.VoiceTitleLockedText = normText(fetter.VoiceTitleLockedText, ctrl.outputLangCode);

      if (fetter.VoiceTitleText) {
        fetter.VoiceTitleTextMap = {
          EN: normText(getTextMapItem('EN', fetter.VoiceTitleTextMapHash), 'EN'),
          CHS: normText(getTextMapItem('CHS', fetter.VoiceTitleTextMapHash), 'CHS'),
          CHT: normText(getTextMapItem('CHT', fetter.VoiceTitleTextMapHash), 'CHT'),
          JP: normText(getTextMapItem('JP', fetter.VoiceTitleTextMapHash), 'JP'),
          KR: normText(getTextMapItem('KR', fetter.VoiceTitleTextMapHash), 'KR')
        };
      }
      if (fetter.VoiceFileText) {
        fetter.VoiceFileTextMap = {
          EN: normText(getTextMapItem('EN', fetter.VoiceFileTextMapHash), 'EN'),
          CHS: normText(getTextMapItem('CHS', fetter.VoiceFileTextMapHash), 'CHS'),
          CHT: normText(getTextMapItem('CHT', fetter.VoiceFileTextMapHash), 'CHT'),
          JP: normText(getTextMapItem('JP', fetter.VoiceFileTextMapHash), 'JP'),
          KR: normText(getTextMapItem('KR', fetter.VoiceFileTextMapHash), 'KR')
        };
      }
      if (fetter.VoiceTitleLockedText) {
        fetter.VoiceTitleLockedTextMap = {
          EN: normText(getTextMapItem('EN', fetter.VoiceTitleLockedTextMapHash), 'EN'),
          CHS: normText(getTextMapItem('CHS', fetter.VoiceTitleLockedTextMapHash), 'CHS'),
          CHT: normText(getTextMapItem('CHT', fetter.VoiceTitleLockedTextMapHash), 'CHT'),
          JP: normText(getTextMapItem('JP', fetter.VoiceTitleLockedTextMapHash), 'JP'),
          KR: normText(getTextMapItem('KR', fetter.VoiceTitleLockedTextMapHash), 'KR')
        };
      }

      fetter.MappedTips = fetter.Tips.map(tip => getTextMapItem(ctrl.outputLangCode, tip)).filter(x => !!x);
      await processFetterConds(ctrl, fetter, 'OpenConds');
    }

    return fettersByAvatar;
  });
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