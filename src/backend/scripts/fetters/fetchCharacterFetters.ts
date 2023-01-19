import '../../loadenv';
import { Control, getControl } from '../script_util';
import { processFetterConds } from './fetterConds';
import {
  createLangCodeMap,
  getAllVoiceItemsOfType,
  getVoiceItems,
  loadEnglishTextMap,
  loadVoiceItems, VoiceItem,
} from '../textmap';
import { closeKnex } from '../../util/db';
import { CharacterFetters, CharacterFettersByAvatar, FetterExcelConfigData } from '../../../shared/types/fetter-types';
import { cached } from '../../util/cache';
import { pathToFileURL } from 'url';
import { fetchCharacterStories } from './fetchStoryFetters';
import chalk from 'chalk';
import { distance as strdist } from 'fastest-levenshtein';
import { AvatarExcelConfigData, isTraveler } from '../../../shared/types/avatar-types';

function getVoAvatarName(avatar: AvatarExcelConfigData, voiceItems: VoiceItem[]): string {
  if (isTraveler(avatar, 'male')) {
    return 'hero';
  }
  if (isTraveler(avatar, 'female')) {
    return 'heroine';
  }
  if (avatar.Id === 10000048) {
    return 'yanfei';
  }
  for (let item of voiceItems) {
    let voAvatarName = /^vo (\S+)/.exec(item.fileName)?.[1];
    let voAvatarNameCmp = voAvatarName?.toLowerCase();
    let approxName = avatar.IconName.split('_').pop().toLowerCase();
    if (!voAvatarNameCmp) {
      continue;
    }
    if (approxName === voAvatarNameCmp) {
      return voAvatarName;
    }
  }
  for (let item of voiceItems) {
    let voAvatarName = /^vo (\S+)/.exec(item.fileName)?.[1];
    let voAvatarNameCmp = voAvatarName?.toLowerCase();
    let approxName = avatar.IconName.split('_').pop().toLowerCase();
    if (!voAvatarNameCmp) {
      continue;
    }
    if (voAvatarNameCmp.includes(approxName) || voAvatarNameCmp.includes(approxName.replace(/ou/g, 'o')) || strdist(voAvatarNameCmp, approxName) <= 2) {
      return voAvatarName;
    }
  }
  return null;
}

export async function fetchCharacterFetters(ctrl: Control): Promise<CharacterFettersByAvatar> {
  return cached('CharacterFetters', async () => {
    let fetters: FetterExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/FettersExcelConfigData.json');
    let fettersByAvatar: CharacterFettersByAvatar = {};
    let aggByVoAvatar: {[voAvatarName: string]: CharacterFetters} = {};

    for (let fetter of fetters) {
      if (!fettersByAvatar[fetter.AvatarId]) {
        fettersByAvatar[fetter.AvatarId] = new CharacterFetters();
      }
      let agg = fettersByAvatar[fetter.AvatarId];
      if (!agg.avatar && fetter.Avatar) {
        agg.avatar = fetter.Avatar;
        agg.avatarName = createLangCodeMap(fetter.Avatar.NameTextMapHash);
      }
      if (agg.avatar && !agg.voAvatarName && fetter.VoiceFile) {
        let voItems = getVoiceItems('Fetter', fetter.VoiceFile);
        if (voItems && voItems.length) {
          agg.voAvatarName = getVoAvatarName(agg.avatar, voItems);
          aggByVoAvatar[agg.voAvatarName] = agg;
        }
      }
      if (agg.voAvatarName && fetter.VoiceFile) {
        let voItems = getVoiceItems('Fetter', fetter.VoiceFile);
        fetter.VoiceFilePath = voItems.find(item => item.fileName.startsWith('vo ' + agg.voAvatarName))?.fileName;
      }
      if (fetter.Type === 1) {
        agg.storyFetters.push(fetter);
      }
      if (fetter.Type === 2) {
        agg.combatFetters.push(fetter);
      }

      delete (<any> fetter).VoiceTitleText;
      delete (<any> fetter).VoiceFileText;
      delete (<any> fetter).VoiceTitleLockedText;

      if (fetter.VoiceTitleTextMapHash) {
        fetter.VoiceTitleTextMap = createLangCodeMap(fetter.VoiceTitleTextMapHash);
      }
      if (fetter.VoiceFileTextMapHash) {
        fetter.VoiceFileTextMap = createLangCodeMap(fetter.VoiceFileTextMapHash);
      }
      if (fetter.VoiceTitleLockedTextMapHash) {
        fetter.VoiceTitleLockedTextMap = createLangCodeMap(fetter.VoiceTitleLockedTextMapHash);
      }
      await processFetterConds(ctrl, fetter, 'OpenConds');
    }

    let fetterVos = getAllVoiceItemsOfType('Fetter');
    let animatorVos = getAllVoiceItemsOfType('AnimatorEvent');
    for (let item of fetterVos) {
      let voAvatarName = /^vo (\S+)/.exec(item.fileName)?.[1];
      let agg = aggByVoAvatar[voAvatarName];
      if (agg) {
        agg.fetterFiles.push(item.fileName);
      }
    }
    for (let item of animatorVos) {
      let voAvatarName = /^vo (\S+)/.exec(item.fileName)?.[1];
      let agg = aggByVoAvatar[voAvatarName];
      if (agg) {
        agg.animatorEventFiles.push(item.fileName);
      }
    }

    return fettersByAvatar;
  });
}

export async function fetchCharacterFettersByAvatarId(ctrl: Control, avatarId: number): Promise<CharacterFetters> {
  let fettersByAvatar = await fetchCharacterFetters(ctrl);
  return fettersByAvatar[avatarId];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    await loadEnglishTextMap();
    await loadVoiceItems();

    const ctrl = getControl();

    let avatars = Object.values(await fetchCharacterStories(ctrl)).map(x => x.avatar);
    let fetterVOs = getAllVoiceItemsOfType('Fetter');
    for (let avatar of avatars) {
      console.log(avatar.NameText, chalk.bold(getVoAvatarName(avatar, fetterVOs)));
    }

    // let res = cleanEmpty(await fetchCharacterFettersByAvatarName(ctrl, 'nahida'));
    // resolveObjectPath(res, 'storyFetters[#EVERY].Avatar', true);
    // resolveObjectPath(res, 'combatFetters[#EVERY].Avatar', true);
    // console.log(util.inspect(res, false, null, true));

    await closeKnex();
  })();
}