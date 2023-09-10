import { LangCodeMap } from './lang-types';
import { AvatarExcelConfigData } from './genshin/avatar-types';
import { AvatarConfig } from './hsr/hsr-avatar-types';
import { CharacterFetters, FetterExcelConfigData } from './genshin/fetter-types';

// region Common Avatar
// --------------------------------------------------------------------------------------------------------------
export interface CommonAvatar<T = any> {
  Id: number,
  Game: 'genshin' | 'hsr' | 'zenless',

  NameText: string,
  NameTextMapHash: number,

  DescText: string,
  DescTextMapHash: number,

  IconName: string,
  SideIconName: string,
  ImagePathPrefix: string,

  Original: T,
}

export function isCommonAvatarFromGenshin(avatar: CommonAvatar): avatar is CommonAvatar<AvatarExcelConfigData> {
  return avatar.Game === 'genshin';
}
export function isCommonAvatarFromStarRail(avatar: CommonAvatar): avatar is CommonAvatar<AvatarConfig> {
  return avatar.Game === 'hsr';
}

export function toCommonAvatarFromGenshin(avatar: AvatarExcelConfigData): CommonAvatar<AvatarExcelConfigData> {
  return {
    Id: avatar.Id,
    Game: 'genshin',

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
  return {
    Id: avatar.AvatarId,
    Game: 'hsr',

    NameText: avatar.AvatarNameText,
    NameTextMapHash: avatar.AvatarNameTextMapHash,

    DescText: avatar.AvatarDescText,
    DescTextMapHash: avatar.AvatarDescTextMapHash,

    IconName: avatar.DefaultAvatarHeadIconPath,
    SideIconName: avatar.AvatarSideIconPath,
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
export interface CommonVoiceItem<T = any> {
  VoiceFile: string,
  TitleTextMap?: LangCodeMap,
  DescTextMap?: LangCodeMap,
  LockedTextMap?: LangCodeMap,
  Original: T,
}

export function toCommonVoiceItemFromGenshin(fetter: FetterExcelConfigData): CommonVoiceItem<FetterExcelConfigData> {
  return {
    VoiceFile: fetter.VoiceFile,
    TitleTextMap: fetter.VoiceTitleTextMap,
    DescTextMap: fetter.VoiceFileTextMap,
    LockedTextMap: fetter.VoiceTitleLockedTextMap,
    Original: fetter
  };
}
export function toCommonVoiceItemsFromGenshin(fetters: FetterExcelConfigData[]): CommonVoiceItem<FetterExcelConfigData>[] {
  return fetters.map(f => toCommonVoiceItemFromGenshin(f));
}
// endregion

// region Common Voice Collection
// --------------------------------------------------------------------------------------------------------------
export class CommonVoiceCollection<T = any> {
  avatar?: CommonAvatar = null;
  avatarName: LangCodeMap;
  voAvatarName: string = null;

  storyItems: CommonVoiceItem[] = [];
  combatItems: CommonVoiceItem[] = [];

  voiceItemFiles: string[] = [];
  animatorEventFiles: string[] = [];

  original: T;
}

export function toCommonVoiceCollectionFromGenshin(fetters: CharacterFetters): CommonVoiceCollection<CharacterFetters> {
  return {
    avatar: fetters.avatar ? toCommonAvatarFromGenshin(fetters.avatar) : null,
    avatarName: fetters.avatarName,
    voAvatarName: fetters.voAvatarName,

    storyItems: toCommonVoiceItemsFromGenshin(fetters.storyFetters),
    combatItems: toCommonVoiceItemsFromGenshin(fetters.combatFetters),

    voiceItemFiles: fetters.fetterFiles,
    animatorEventFiles: fetters.animatorEventFiles,

    original: fetters
  }
}
// endregion