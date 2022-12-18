import { ConfigCondition, NpcExcelConfigData } from './general-types';

export type LangCode = 'CH' | 'CHS' | 'CHT' | 'DE' | 'EN' | 'ES' | 'FR' | 'ID' | 'IT' | 'JP' | 'KR' | 'PT' | 'RU' | 'TH' | 'TR' | 'VI';
export const LANG_CODES: LangCode[] = ['CH', 'CHS', 'CHT', 'DE', 'EN', 'ES', 'FR', 'ID', 'IT', 'JP', 'KR', 'PT', 'RU', 'TH', 'TR', 'VI'];
export const LANG_CODES_TO_NAME = {
  CH: 'Chinese',
  CHS: 'Chinese (Simplified)',
  CHT: 'Chinese (Traditional)',
  DE: 'German',
  EN: 'English',
  ES: 'Spanish',
  FR: 'French',
  ID: 'Indonesian',
  IT: 'Italian',
  JP: 'Japanese',
  KR: 'Korean',
  PT: 'Portuguese',
  RU: 'Russian',
  TH: 'Thai',
  TR: 'Turkish',
  VI: 'Vietnamese',
};
export const LANG_CODE_TO_WIKI_CODE = {
  CH: 'ZH',
  CHS: 'ZHS',
  CHT: 'ZHT',
  DE: 'DE',
  EN: 'EN',
  ES: 'ES',
  FR: 'FR',
  ID: 'ID',
  IT: 'IT',
  JP: 'JA',
  KR: 'KO',
  PT: 'PT',
  RU: 'RU',
  TH: 'TH',
  TR: 'TR',
  VI: 'VI',
};

export type TalkRoleType =
  'TALK_ROLE_NPC'
  | 'TALK_ROLE_PLAYER'
  | 'TALK_ROLE_BLACK_SCREEN'
  | 'TALK_ROLE_MATE_AVATAR'
  | 'TALK_ROLE_GADGET'
  | 'TALK_ROLE_CONSEQUENT_BLACK_SCREEN'
  | 'TALK_ROLE_NEED_CLICK_BLACK_SCREEN'
  | 'TALK_ROLE_CONSEQUENT_NEED_CLICK_BLACK_SCREEN';

export interface TalkRole {
  Type: TalkRoleType,
  Id: number | string,
  NameTextMapHash?: number,
  NameText?: string,
}

export interface DialogExcelConfigData {
  Id: number,
  NextDialogs: number[],
  TalkShowType?: 'TALK_SHOW_FORCE_SELECT',
  TalkRole: TalkRole,
  TalkContentTextMapHash: number,
  TalkContentText?: string,
  TalkTitleTextMapHash: number,
  TalkTitleTextMap?: string,
  TalkRoleNameTextMapHash: number,
  TalkRoleNameText?: string,
  TalkAssetPath: string,
  TalkAssetPathAlter: string,
  TalkAudioName: string,
  ActionBefore: string,
  ActionWhile: string,
  ActionAfter: string,
  OptionIcon: string,
  Branches?: DialogExcelConfigData[][],
  Recurse?: boolean
}

export interface LoadingTipsExcelConfigData {
  Id: number,
  TipsTitleText?: string,
  TipsTitleTextMapHash: number,
  TipsDescText?: string,
  TipsDescTextMapHash: number,
  StageId: string,
  StartTime: string,
  EndTime: string,
  LimitOpenState: string,
  PreMainQuestIds: string,
  Weight: number
}

export interface ManualTextMapConfigData {
  TextMapId: string,
  TextMapContentText?: string,
  TextMapContentTextMapHash: number,
  ParamTypes: string[],
}

export interface TalkExcelConfigData {
  Id: number,
  QuestId: number,
  QuestCondStateEqualFirst: number,
  BeginWay: string,
  ActiveMode: string,
  BeginCondComb: string,
  BeginCond: ConfigCondition[],
  Priority: number,
  NextTalks: number[],
  NextTalksDataList: TalkExcelConfigData[],
  InitDialog: number,
  NpcId: number[],
  NpcDataList?: NpcExcelConfigData[],
  NpcNameList?: string[],
  ParticipantId: number[],
  PerformCfg: string,
  QuestIdleTalk: boolean,
  HeroTalk: string,
  ExtraLoadMarkId: number[],
  PrePerformCfg: string,
  FinishExec: ConfigCondition[]
  Dialog?: DialogExcelConfigData[],
}

export interface ReminderExcelConfigData {
  Id: number,
  SpeakerText: string,
  SpeakerTextMapHash: number,
  ContentText: string,
  ContentTextMapHash: number,
  Delay: number,
  ShowTime: number,
  NextReminderId: number,
  SoundEffect: string,
  HasAudio: boolean,
}
