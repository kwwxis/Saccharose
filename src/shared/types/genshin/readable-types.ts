/*
 * BooksCodexExcelConfigData
 * BookSuitExcelConfigData
 * LocalizationExcelConfigData
 * DocumentExcelConfigData
 *
 * MaterialExcelConfigData.SetId               -> BookSuitExcelConfigData.Id
 * BooksCodexExcelConfigData.MaterialId        -> DocumentExcelConfigData.Id
 * ReliquaryExcelConfigData.StoryId            -> DocumentExcelConfigData.Id
 * DocumentExcelConfigData.ContentLocalizedIds -> LocalizationExcelConfigData.Id
 */

import { MaterialExcelConfigData } from './material-types.ts';
import { ReliquaryCodexExcelConfigData, ReliquaryExcelConfigData, ReliquarySetExcelConfigData } from './artifact-types.ts';
import { WeaponExcelConfigData } from './weapon-types.ts';
import { MainQuestExcelConfigData } from './quest-types.ts';
import { Marker } from '../../util/highlightMarker.ts';
import { LangCode, LangCodeMap } from '../lang-types.ts';

// Search View
// --------------------------------------------------------------------------------------------------------------

export interface ReadableSearchResult {
  TitleResults: Readable[]
  ContentResults: Readable[]
}

// Book View
// --------------------------------------------------------------------------------------------------------------

export interface Readable {
  Id: number,
  TitleText?: string,
  TitleTextMapHash?: number,
  Icon?: string,

  Document: DocumentExcelConfigData,
  Items: ReadableItem[],

  Material?: MaterialExcelConfigData,
  BookSuit?: BookSuitExcelConfigData,
  BookCodex?: BooksCodexExcelConfigData,

  Artifact?: ReliquaryExcelConfigData,
  ArtifactSet?: ReliquarySetExcelConfigData,
  ArtifactCodex?: ReliquaryCodexExcelConfigData,

  Weapon?: WeaponExcelConfigData,
}

export interface ReadableArchive {
  BookCollections: {[suitId: number]: BookSuitExcelConfigData};
  Materials: Readable[];
  Artifacts: Readable[];
  Weapons: Readable[];
}

// Book Suite Types
// --------------------------------------------------------------------------------------------------------------

/**
 * Sort order within a BookCodex
 */
export interface BooksCodexExcelConfigData {
  Id: number,
  MaterialId: number,
  SortOrder: number,
  IsDisuse: boolean,
}

/**
 * Collection of multiple readables within a Book Suite
 */
export interface BookSuitExcelConfigData {
  Id: number,
  SuitNameTextMapHash: number,
  SuitNameText?: string,
  Books?: Readable[],
}

// Readable Item
// --------------------------------------------------------------------------------------------------------------

export interface ReadableText {
  LangCode: LangCode,
  LangPath: string,

  AsNormal: string,
  AsDialogue: string,
  AsTemplate: string,

  Markers?: {
    AsNormal?: Marker[],
    AsDialogue?: Marker[],
    AsTemplate?: Marker[],
  }
}

export interface ReadableItem {
  Page: number,
  IsAlternate: boolean,
  Localization: LocalizationExcelConfigData,
  ReadableImages: string[],
  MainQuestTrigger?: MainQuestExcelConfigData,

  ReadableText: ReadableText,

  Expanded?: ReadableText[]
}

export const LANG_CODE_TO_LOCALIZATION_PATH_PROP = {
  CHS: 'ScPath',
  CHT: 'TcPath',
  DE: 'DePath',
  EN: 'EnPath',
  ES: 'EsPath',
  FR: 'FrPath',
  ID: 'IdPath',
  IT: 'ItPath',
  JP: 'JpPath',
  KR: 'KrPath',
  PT: 'PtPath',
  RU: 'RuPath',
  TH: 'ThPath',
  TR: 'TrPath',
  VI: 'ViPath',
};

export interface LocalizationExcelConfigData {
  Id: number,
  AssetType:
    'LOC_IMAGE' |
    'LOC_SUBTITLE' |
    'LOC_TEXT' |
    'LOC_TROPHY_SET_ICON',
  DefaultPath: string,
  ScPath: string,
  TcPath: string,
  EnPath: string,
  KrPath: string,
  JpPath: string,
  EsPath: string,
  FrPath: string,
  IdPath: string,
  PtPath: string,
  RuPath: string,
  ThPath: string,
  ViPath: string,
  DePath: string,
  TrPath: string,
  ItPath: string,
}

export interface DocumentExcelConfigData {
  Id: number,
  TitleTextMapHash: number,
  TitleText?: string,
  TitleTextMap?: LangCodeMap,
  PreviewPath: string,
  DocumentType?: 'Video' | undefined,
  VideoPath?: string,
  SubtitleId?: number,

  ContentLocalizedIds: number[],
  QuestIdList: number[], // Quest trigger condition for alternate
  QuestContentLocalizedIds: number[], // Alternate ContentLocalizedIds
}
