import { LangCodeMap } from '../lang-types.ts';
import { ConditionGroup } from './condition-types.ts';

export interface FavorGoods {
  CondGroupId: number,
  CondGroup: ConditionGroup,
  Content: string,
  ContentText: string,
  Id: number,
  Pic: string,
  RoleId: number,
  Sort: number,
  Title: string,
  TitleText: string,
  Type: number,
}

export interface FavorRoleInfo {
  Birthday: string,
  BirthdayText: string,
  CondGroupId: number,
  Country: string,
  CountryText: string,
  CvnameCn: string,
  CvnameCnText: string,
  CvnameEn: string,
  CvnameEnText: string,
  CvnameJp: string,
  CvnameJpText: string,
  CvnameKo: string,
  CvnameKoText: string,
  Id: number,
  Influence: string,
  InfluenceText: string,
  Info: string,
  InfoText: string,
  RoleId: number,
  Sex: string,
  SexText: string,
  TalentCertification: string,
  TalentCertificationText: string,
  TalentDoc: string,
  TalentDocText: string,
  TalentName: string,
  TalentNameText: string,
}

export interface FavorStory {
  CondGroupId: number,
  Content: string,
  ContentText: string,
  Id: number,
  RoleId: number,
  Sort: number,
  Title: string,
  TitleText: string,
  Type: number,
}



export interface FavorWord {
  Id: number,
  Type: 1 | 2,
  RoleId: number,
  Sort: number,

  CondGroupId: number,
  CondGroup: ConditionGroup,
  CondSummary: FavorWordCondSummary,

  Content: string,
  ContentTextMap: LangCodeMap,

  Title: string,
  TitleTextMap: LangCodeMap,

  Voice: string,
}

export interface FavorWordCondSummary {
  HintTextMap: LangCodeMap,
  CondDescriptions: LangCodeMap[],
  Intimacy?: number,
  Ascension?: number,
}

export interface FavorWordGroup {
  roleId: number;
  roleName: LangCodeMap;
  storyFavorWords: FavorWord[];
  combatFavorWords: FavorWord[];
}

export type FavorWordGroupByRole = { [roleId: number]: FavorWordGroup };

