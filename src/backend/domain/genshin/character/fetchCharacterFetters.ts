import '../../../loadenv.ts';
import { GenshinControl, getGenshinControl, loadGenshinVoiceItems } from '../genshinControl.ts';
import { processFetterConds } from './fetterConds.ts';
import { closeKnex } from '../../../util/db.ts';
import { FetterGroup, FetterGroupByAvatar, FetterExcelConfigData } from '../../../../shared/types/genshin/fetter-types.ts';
import { pathToFileURL } from 'url';
import { fetchCharacterStories } from './fetchStoryFetters.ts';
import chalk from 'chalk';
import { distance as strdist } from 'fastest-levenshtein';
import { AvatarExcelConfigData, isTraveler } from '../../../../shared/types/genshin/avatar-types.ts';
import { VoiceItem } from '../../../../shared/types/lang-types.ts';
import { DATAFILE_GENSHIN_FETTERS } from '../../../loadenv.ts';
import path from 'path';
import fs from 'fs';
import { defaultMap } from '../../../../shared/util/genericUtil.ts';
import { mapBy } from '../../../../shared/util/arrayUtil.ts';

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
  if (avatar.Id === 10000093) {
    return 'xianyun';
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

export async function fetchCharacterFetters(ctrl: GenshinControl, skipCache: boolean = false): Promise<FetterGroupByAvatar> {
  if (!skipCache) {
    return ctrl.cached('Fetters:FetterGroup', 'json', async () => {
      const filePath = path.resolve(process.env.GENSHIN_DATA_ROOT, DATAFILE_GENSHIN_FETTERS);
      const result: FetterGroupByAvatar = JSON.parse(fs.readFileSync(filePath, {encoding: 'utf8'}));
      return result;
    });
  }

  ctrl = ctrl.copy();
  ctrl.state.AutoloadAvatar = false;
  ctrl.state.AutoloadText = false;

  const avatarMap: {[avatarId: number]: AvatarExcelConfigData} = mapBy(await ctrl.selectAllAvatars(), 'Id');

  return ctrl.cached('Fetters:FetterGroup', 'json', async () => {
    let fetters: FetterExcelConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/FettersExcelConfigData.json');
    let fettersByAvatar: FetterGroupByAvatar = defaultMap((avatarId: number) => <FetterGroup> {
      avatarId,
      avatarName: null,
      storyFetters: [],
      combatFetters: [],
      voAvatarName: null,
      fetterFiles: [],
      animatorEventFiles: [],
    });
    let aggByVoAvatar: {[voAvatarName: string]: FetterGroup} = {};

    for (let fetter of fetters) {
      let agg = fettersByAvatar[fetter.AvatarId];

      if (!agg.avatarName) {
        agg.avatarName = await ctrl.createLangCodeMap(avatarMap[fetter.AvatarId].NameTextMapHash);
      }

      if (agg.avatarName && !agg.voAvatarName && fetter.VoiceFile) {
        let voItems = ctrl.voice.getVoiceItems('Fetter', fetter.VoiceFile);
        if (voItems && voItems.length) {
          agg.voAvatarName = getVoAvatarName(avatarMap[agg.avatarId], voItems);
          aggByVoAvatar[agg.voAvatarName] = agg;
        }
      }

      if (agg.voAvatarName && fetter.VoiceFile) {
        let voItems = ctrl.voice.getVoiceItems('Fetter', fetter.VoiceFile);
        fetter.VoiceFilePath = voItems && voItems.find(item => item.fileName.startsWith('vo ' + agg.voAvatarName))?.fileName;
      }

      if (fetter.Type === 1) {
        agg.storyFetters.push(fetter);
      }
      if (fetter.Type === 2) {
        agg.combatFetters.push(fetter);
      }

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

export async function fetchCharacterFettersByAvatarId(ctrl: GenshinControl, avatarId: number): Promise<FetterGroup> {
  return (await fetchCharacterFetters(ctrl))[avatarId];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    await loadGenshinVoiceItems();

    const ctrl = getGenshinControl();

    let avatars = Object.values(await fetchCharacterStories(ctrl)).map(x => x.avatar);
    let fetterVOs = ctrl.voice.getVoiceItemsByType('Fetter');
    for (let avatar of avatars) {
      let voAvatarName = getVoAvatarName(avatar, fetterVOs);
      console.log(avatar.Id, avatar.NameText, voAvatarName === null ? chalk.red.bold(voAvatarName) : chalk.bold(voAvatarName));
    }

    // let res = cleanEmpty(await fetchCharacterFettersByAvatarName(ctrl, 'nahida'));
    // resolveObjectPath(res, 'storyFetters[#EVERY].Avatar', true);
    // resolveObjectPath(res, 'combatFetters[#EVERY].Avatar', true);
    // console.log(util.inspect(res, false, null, true));

    await closeKnex();
  })();
}
