import '../../../loadenv';
import { GenshinControl, getGenshinControl, loadGenshinVoiceItems } from '../genshinControl';
import { processFetterConds } from './fetterConds';
import { closeKnex } from '../../../util/db';
import { CharacterFetters, CharacterFettersByAvatar, FetterExcelConfigData } from '../../../../shared/types/genshin/fetter-types';
import { cached } from '../../../util/cache';
import { pathToFileURL } from 'url';
import { fetchCharacterStories } from './fetchStoryFetters';
import chalk from 'chalk';
import { distance as strdist } from 'fastest-levenshtein';
import { AvatarExcelConfigData, isTraveler } from '../../../../shared/types/genshin/avatar-types';
import { VoiceItem } from '../../../../shared/types/lang-types';
import { DATAFILE_GENSHIN_FETTERS } from '../../../loadenv';
import path from 'path';
import { promises as fs } from 'fs';

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

export async function fetchCharacterFetters(ctrl: GenshinControl, skipCache: boolean = false): Promise<CharacterFettersByAvatar> {
  if (!skipCache) {
    return cached('CharacterFetters', async () => {
      const fettersFilePath = path.resolve(process.env.GENSHIN_DATA_ROOT, DATAFILE_GENSHIN_FETTERS);
      const result: CharacterFettersByAvatar = await fs.readFile(fettersFilePath, {encoding: 'utf8'}).then(data => JSON.parse(data));
      return result;
    });
  }
  return cached('CharacterFetters', async () => {
    let fetters: FetterExcelConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/FettersExcelConfigData.json');
    let fettersByAvatar: CharacterFettersByAvatar = {};
    let aggByVoAvatar: {[voAvatarName: string]: CharacterFetters} = {};

    for (let fetter of fetters) {
      if (!fettersByAvatar[fetter.AvatarId]) {
        fettersByAvatar[fetter.AvatarId] = new CharacterFetters();
      }
      let agg = fettersByAvatar[fetter.AvatarId];
      if (!agg.avatar && fetter.Avatar) {
        agg.avatar = fetter.Avatar;
        agg.avatarName = await ctrl.createLangCodeMap(fetter.Avatar.NameTextMapHash);
      }
      if (agg.avatar && !agg.voAvatarName && fetter.VoiceFile) {
        let voItems = ctrl.voice.getVoiceItems('Fetter', fetter.VoiceFile);
        if (voItems && voItems.length) {
          agg.voAvatarName = getVoAvatarName(agg.avatar, voItems);
          aggByVoAvatar[agg.voAvatarName] = agg;
        }
      }
      if (agg.voAvatarName && fetter.VoiceFile) {
        let voItems = ctrl.voice.getVoiceItems('Fetter', fetter.VoiceFile);
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
        fetter.VoiceTitleTextMap = await ctrl.createLangCodeMap(fetter.VoiceTitleTextMapHash);
      }
      if (fetter.VoiceFileTextMapHash) {
        fetter.VoiceFileTextMap = await ctrl.createLangCodeMap(fetter.VoiceFileTextMapHash);
      }
      if (fetter.VoiceTitleLockedTextMapHash) {
        fetter.VoiceTitleLockedTextMap = await ctrl.createLangCodeMap(fetter.VoiceTitleLockedTextMapHash);
      }
      await processFetterConds(ctrl, fetter, 'OpenConds');
      await processFetterConds(ctrl, fetter, 'FinishConds');
    }

    let fetterVos = ctrl.voice.getVoiceItemsByType('Fetter');
    let animatorVos = ctrl.voice.getVoiceItemsByType('AnimatorEvent');
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

export async function fetchCharacterFettersByAvatarId(ctrl: GenshinControl, avatarId: number): Promise<CharacterFetters> {
  let fettersByAvatar = await fetchCharacterFetters(ctrl);
  return fettersByAvatar[avatarId];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    await loadGenshinVoiceItems();

    const ctrl = getGenshinControl();

    let avatars = Object.values(await fetchCharacterStories(ctrl)).map(x => x.avatar);
    let fetterVOs = ctrl.voice.getVoiceItemsByType('Fetter');
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