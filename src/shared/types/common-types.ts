import { LangCodeMap, TextMapHash } from './lang-types.ts';
import { AvatarExcelConfigData } from './genshin/avatar-types.ts';
import { AvatarConfig, VoiceAtlas, VoiceAtlasGroup } from './hsr/hsr-avatar-types.ts';
import { FetterExcelConfigData, FetterGroup } from './genshin/fetter-types.ts';
import { toInt } from '../util/numberUtil.ts';

// region Common Avatar
// --------------------------------------------------------------------------------------------------------------
export interface CommonAvatar<T = any> {
  Id: number,

  NameText: string,
  NameTextMapHash: number,

  DescText: string,
  DescTextMapHash: number,

  IconName: string,
  SideIconName: string,
  ImagePathPrefix: string,

  Original: T,
}

export function toCommonAvatarFromGenshin(avatar: AvatarExcelConfigData): CommonAvatar<AvatarExcelConfigData> {
  if (!avatar) return null;
  return {
    Id: avatar.Id,

    NameText: avatar.NameText,
    NameTextMapHash: avatar.NameTextMapHash,

    DescText: avatar.DescText,
    DescTextMapHash: avatar.DescTextMapHash,

    IconName: avatar.IconName,
    SideIconName: avatar.SideIconName,
    ImagePathPrefix: '/images/genshin/',

    Original: avatar,
  };
}
export function toCommonAvatarsFromGenshin(avatars: AvatarExcelConfigData[]): CommonAvatar<AvatarExcelConfigData>[] {
  return avatars.map(a => toCommonAvatarFromGenshin(a));
}

export function toCommonAvatarFromStarRail(avatar: AvatarConfig): CommonAvatar<AvatarConfig> {
  if (!avatar) return null;
  return {
    Id: avatar.Id,

    NameText: avatar.NameText,
    NameTextMapHash: avatar.NameTextMapHash,

    DescText: avatar.DescText,
    DescTextMapHash: avatar.DescTextMapHash,

    IconName: avatar.DefaultHeadIconPath,
    SideIconName: avatar.SideIconPath,
    ImagePathPrefix: '/images/hsr/',

    Original: avatar
  };
}
export function toCommonAvatarsFromStarRail(avatars: AvatarConfig[]): CommonAvatar<AvatarConfig>[] {
  return avatars.map(a => toCommonAvatarFromStarRail(a));
}
// endregion

// region Common Voice Item
// --------------------------------------------------------------------------------------------------------------
export interface CommonVoiceOver<T = any> {
  VoiceFile: string,
  TitleTextMap?: LangCodeMap,
  DescTextMap?: LangCodeMap,
  LockedTextMap?: LangCodeMap,
  Original: T,
}

export function toCommonVoiceOverFromGenshin(fetter: FetterExcelConfigData): CommonVoiceOver<FetterExcelConfigData> {
  return {
    VoiceFile: fetter.VoiceFile,
    TitleTextMap: fetter.VoiceTitleTextMap,
    DescTextMap: fetter.VoiceFileTextMap,
    LockedTextMap: fetter.VoiceTitleLockedTextMap,
    Original: fetter
  };
}
export function toCommonVoiceOversFromGenshin(fetters: FetterExcelConfigData[]): CommonVoiceOver<FetterExcelConfigData>[] {
  return fetters.map(f => toCommonVoiceOverFromGenshin(f));
}

export function toCommonVoiceOverFromStarRail(atlas: VoiceAtlas): CommonVoiceOver<VoiceAtlas> {
  return {
    VoiceFile: atlas.VoiceItem?.fileName,
    TitleTextMap: atlas.VoiceTitleTextMap,
    DescTextMap: atlas.VoiceMTextMap,
    LockedTextMap: atlas.UnlockDescTextMap,
    Original: atlas
  };
}
export function toCommonVoiceOversFromStarRail(atlases: VoiceAtlas[]): CommonVoiceOver<VoiceAtlas>[] {
  return atlases.map(a => toCommonVoiceOverFromStarRail(a));
}
// endregion

// region Common Voice Over Group
// --------------------------------------------------------------------------------------------------------------
export class CommonVoiceOverGroup<T = any> {
  avatarId: number;
  avatarName: LangCodeMap;

  storyVoiceOvers: CommonVoiceOver[] = [];
  combatVoiceOvers: CommonVoiceOver[] = [];
  animatorEventFiles: string[] = [];

  original: T;
}

export function toCommonVoiceOverGroupFromGenshin(fetterGroup: FetterGroup): CommonVoiceOverGroup<FetterGroup> {
  return {
    avatarId: fetterGroup.avatarId,
    avatarName: fetterGroup.avatarName,

    storyVoiceOvers: toCommonVoiceOversFromGenshin(fetterGroup.storyFetters),
    combatVoiceOvers: toCommonVoiceOversFromGenshin(fetterGroup.combatFetters),
    animatorEventFiles: fetterGroup.animatorEventFiles,

    original: fetterGroup
  }
}

export function toCommonVoiceOverGroupFromStarRail(atlasGroup: VoiceAtlasGroup): CommonVoiceOverGroup<VoiceAtlasGroup> {
  return {
    avatarId: atlasGroup.avatarId,
    avatarName: atlasGroup.avatarName,

    storyVoiceOvers: toCommonVoiceOversFromStarRail(atlasGroup.storyAtlases),
    combatVoiceOvers: toCommonVoiceOversFromStarRail(atlasGroup.combatAtlases),
    animatorEventFiles: [],

    original: atlasGroup
  }
}
// endregion

// region Common Line IDs
// --------------------------------------------------------------------------------------------------------------
export type CommonLineId = { commonId?: number, textMapHash?: TextMapHash };

export function stringifyCommonLineIds(dialogLineIds: CommonLineId[]): string {
  if (!dialogLineIds || !dialogLineIds.length) {
    return '';
  }
  return dialogLineIds.map(x => {
    if (x) {
      return (x.commonId || '') + ',' + (x.textMapHash || '');
    } else {
      return '';
    }
  }).join(';');
}

export function parseCommonLineIds(str: string): CommonLineId[] {
  if (!str) {
    return [];
  }
  return str.split(';').map(s => {
    if (!s) {
      return null;
    } else {
      let parts = s.split(',');
      return {
        commonId: parts[0] ? toInt(parts[0]) : undefined,
        textMapHash: (parts[1] || undefined) as TextMapHash,
      };
    }
  });
}
// endregion

// region Other
// --------------------------------------------------------------------------------------------------------------
export interface MediaSearchResult {
  fileHash: string,
  matches: { name: string, hash: number, distance: number }[]
}

export interface LangDetectResult {
  isReliable: boolean,
  details: { langName: string, langCode: string, confidence: number }[]
}
// endregion
