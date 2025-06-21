import '../../../loadenv.ts';
import { closeKnex } from '../../../util/db.ts';
import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';
import {
  AtlasUnlockData, AvatarConfig,
  VoiceAtlas,
  VoiceAtlasGroup,
  VoiceAtlasGroupByAvatar,
} from '../../../../shared/types/hsr/hsr-avatar-types.ts';
import {
  getStarRailControl,
  loadStarRailVoiceItems,
  normalizeStarRailVoicePath,
  StarRailControl,
} from '../starRailControl.ts';
import { DATAFILE_HSR_VOICE_ATLASES } from '../../../loadenv.ts';
import { defaultMap } from '../../../../shared/util/genericUtil.ts';
import { mapBy } from '../../../../shared/util/arrayUtil.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { fsReadJson } from '../../../util/fsutil.ts';

export async function fetchVoiceAtlases(ctrl: StarRailControl, skipCache: boolean = false): Promise<VoiceAtlasGroupByAvatar> {
  if (!skipCache) {
    return ctrl.cached('VoiceAtlasGroup', 'json', async () => {
      const filePath = path.resolve(process.env.HSR_DATA_ROOT, DATAFILE_HSR_VOICE_ATLASES);
      const result: VoiceAtlasGroupByAvatar = await fsReadJson(filePath);
      return result;
    });
  }

  ctrl = ctrl.copy();
  ctrl.state.AutoloadAvatar = false;
  ctrl.state.AutoloadText = false;

  const avatarMap: {[avatarId: number]: AvatarConfig} = mapBy(await ctrl.selectAllAvatars(), 'Id');

  return ctrl.cached('VoiceAtlasGroup', 'json', async () => {
    let voiceAtlases: VoiceAtlas[] = await ctrl.readExcelDataFile('VoiceAtlas.json');
    let voiceAtlasGroupByAvatar: VoiceAtlasGroupByAvatar =
      defaultMap((avatarId: number) => <VoiceAtlasGroup> {
        avatarId: avatarId,
        storyAtlases: [],
        combatAtlases: [],
      });

    let unlockData: {[unlockId: number]: AtlasUnlockData} = await ctrl.readExcelDataFileToStream<AtlasUnlockData>('AtlasUnlockData.json')
      .toMap('UnlockId');

    for (let voiceAtlas of voiceAtlases) {
      let agg = voiceAtlasGroupByAvatar[voiceAtlas.AvatarId];

      if (!agg.avatarName) {
        agg.avatarName = await ctrl.createLangCodeMap(avatarMap[voiceAtlas.AvatarId].NameTextMapHash);
      }

      if (voiceAtlas.AudioId) {
        voiceAtlas.VoiceItem = ctrl.voice.getVoiceItem(voiceAtlas.AudioId);
      } else if (voiceAtlas.AudioEvent) {
        voiceAtlas.VoiceItem = {
          id: 0,
          fileName: normalizeStarRailVoicePath(voiceAtlas.AudioEvent),
          isGendered: false,
          type: 'Archive'
        }
      }
      if (voiceAtlas.Unlock) {
        voiceAtlas.UnlockData = unlockData[voiceAtlas.Unlock];
      }

      if (voiceAtlas.IsBattleVoice) {
        agg.combatAtlases.push(voiceAtlas);
      } else {
        agg.storyAtlases.push(voiceAtlas);
      }

      if (voiceAtlas.VoiceTitleTextMapHash) {
        voiceAtlas.VoiceTitleTextMap = await ctrl.createLangCodeMap(voiceAtlas.VoiceTitleTextMapHash);
      }
      if (voiceAtlas.VoiceMTextMapHash) {
        voiceAtlas.VoiceMTextMap = await ctrl.createLangCodeMap(voiceAtlas.VoiceMTextMapHash);
      }
      if (voiceAtlas.UnlockDescTextMapHash && !(await ctrl.isEmptyTextMapItem(ctrl.outputLangCode, voiceAtlas.UnlockDescTextMapHash))) {
        voiceAtlas.UnlockDescTextMap = await ctrl.createLangCodeMap(voiceAtlas.UnlockDescTextMapHash);
      }
      if (voiceAtlas.VoiceFTextMapHash && !(await ctrl.isEmptyTextMapItem(ctrl.outputLangCode, voiceAtlas.VoiceFTextMapHash))) {
        voiceAtlas.VoiceFTextMap = await ctrl.createLangCodeMap(voiceAtlas.VoiceFTextMapHash);
      }

      if (voiceAtlas.UnlockData?.Conditions) {
        for (let condition of voiceAtlas.UnlockData.Conditions) {
          if (condition.Type === 'FinishMainMission') {
            voiceAtlas.UnlockMissionNameTextMap = await ctrl.selectMainMissionNameTextMap(toInt(condition.Param));
          }
        }
      }
    }

    return voiceAtlasGroupByAvatar;
  });
}

export async function fetchVoiceAtlasByAvatarId(ctrl: StarRailControl, avatarId: number): Promise<VoiceAtlasGroup> {
  return (await fetchVoiceAtlases(ctrl))[avatarId];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    await loadStarRailVoiceItems();

    const ctrl = getStarRailControl();

    inspect(await fetchVoiceAtlases(ctrl, true));

    await closeKnex();
  })();
}
