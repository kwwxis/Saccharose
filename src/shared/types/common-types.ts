import { LangCodeMap, TextMapHash } from './lang-types.ts';
import { AvatarExcelConfigData } from './genshin/avatar-types.ts';
import { AvatarConfig, VoiceAtlas, VoiceAtlasGroup } from './hsr/hsr-avatar-types.ts';
import { FetterExcelConfigData, FetterGroup } from './genshin/fetter-types.ts';
import { toInt } from '../util/numberUtil.ts';
import { RoleInfo } from './wuwa/role-types.ts';
import { FavorWord, FavorWordGroup } from './wuwa/favor-types.ts';

// region Common Avatar
// --------------------------------------------------------------------------------------------------------------
export interface CommonAvatar<T = any> {
  Id: number,

  NameText: string,
  NameTextMapHash: TextMapHash,

  DescText: string,
  DescTextMapHash: TextMapHash,

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

export function toCommonAvatarFromWuwa(role: RoleInfo): CommonAvatar<RoleInfo> {
  if (!role) return null;
  return {
    Id: role.Id,

    NameText: role.NameText,
    NameTextMapHash: role.Name,

    DescText: role.IntroductionText,
    DescTextMapHash: role.Introduction,

    IconName: role.RoleHeadIconCircle,
    SideIconName: role.RoleHeadIcon,
    ImagePathPrefix: '/images/wuwa/',

    Original: role
  };
}
export function toCommonAvatarsFromWuwa(roles: RoleInfo[]): CommonAvatar<RoleInfo>[] {
  return roles.map(a => toCommonAvatarFromWuwa(a));
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

export function toCommonVoiceOverFromWuwa(favorWord: FavorWord): CommonVoiceOver<FavorWord> {
  return {
    VoiceFile: favorWord.Voice,
    TitleTextMap: favorWord.TitleTextMap,
    DescTextMap: favorWord.ContentTextMap,
    LockedTextMap: favorWord.CondSummary.HintTextMap,
    Original: favorWord
  };
}
export function toCommonVoiceOversFromWuwa(favorWords: FavorWord[]): CommonVoiceOver<FavorWord>[] {
  return favorWords.map(a => toCommonVoiceOverFromWuwa(a));
}
// endregion

// region Common Voice Over Group
// --------------------------------------------------------------------------------------------------------------
export interface CommonVoiceOverGroup<T = any> {
  avatarId: number;
  avatarName: LangCodeMap;

  storyVoiceOvers: CommonVoiceOver[];
  combatVoiceOvers: CommonVoiceOver[];
  animatorEventFiles: string[];

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

export function toCommonVoiceOverGroupFromWuwa(group: FavorWordGroup): CommonVoiceOverGroup<FavorWordGroup> {
  return {
    avatarId: group.roleId,
    avatarName: group.roleName,

    storyVoiceOvers: toCommonVoiceOversFromWuwa(group.storyFavorWords),
    combatVoiceOvers: toCommonVoiceOversFromWuwa(group.combatFavorWords),
    animatorEventFiles: [],

    original: group
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
