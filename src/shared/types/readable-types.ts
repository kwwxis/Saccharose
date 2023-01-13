/*
 * BooksCodexExcelConfigData
 * BookSuitExcelConfigData
 * LocalizationExcelConfigData
 * DocumentExcelConfigData
 *
 * MaterialExcelConfigData.SetId               -> BookSuitExcelConfigData.Id
 * BooksCodexExcelConfigData.MaterialId        -> DocumentExcelConfigData.Id
 * ReliquaryExcelConfigData.StoryId            -> DocumentExcelConfigData.Id
 * DocumentExcelConfigData.ContentLocalizedId  -> LocalizationExcelConfigData.Id
 */

import { MaterialExcelConfigData } from './material-types';
import { ReliquaryCodexExcelConfigData, ReliquaryExcelConfigData, ReliquarySetExcelConfigData } from './artifact-types';
import { WeaponExcelConfigData } from './weapon-types';
import { MainQuestExcelConfigData } from './quest-types';

// Book View
// --------------------------------------------------------------------------------------------------------------

export interface ReadableView extends Readable {
  Id: number,
  Material?: MaterialExcelConfigData,
  BookSuit?: BookSuitExcelConfigData,
  BookCodex?: BooksCodexExcelConfigData,

  Artifact?: ReliquaryExcelConfigData,
  ArtifactSet?: ReliquarySetExcelConfigData,
  ArtifactCodex?: ReliquaryCodexExcelConfigData,

  Weapon?: WeaponExcelConfigData,
}

export interface ReadableArchiveView {
  BookCollections: {[suitId: number]: BookSuitExcelConfigData};
  Materials: ReadableView[];
  Artifacts: ReadableView[];
  Weapons: ReadableView[];
}

// Book Types
// --------------------------------------------------------------------------------------------------------------

export interface BooksCodexExcelConfigData {
  Id: number,
  MaterialId: number,
  SortOrder: number,
  IsDisuse: boolean,
}

export interface BookSuitExcelConfigData {
  Id: number,
  SuitNameTextMapHash: number,
  SuitNameText?: string,
  Books?: ReadableView[],
}

// Common Readable
// --------------------------------------------------------------------------------------------------------------

export interface ReadableItem {
  Localization: LocalizationExcelConfigData,
  ReadableText: string,
  MainQuestTrigger?: MainQuestExcelConfigData
}

export interface Readable {
  Document: DocumentExcelConfigData,
  Items: ReadableItem[],
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
  TitleTextEN?: string,
  ContentLocalizedId: number,
  PreviewPath: string,
  DocumentType?: 'Video' | undefined,
  VideoPath?: string,
  SubtitleId?: number,
  NHNENGFHDEG: number[], // Quest trigger condition for alternate
  HGHPAKBJLMN: number[], // Alternate ContentLocalizedIds
}