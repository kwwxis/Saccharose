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

export interface ReadableSearchView {
  TitleResults: ReadableView[]
  ContentResults: ReadableView[]
}

// Book View
// --------------------------------------------------------------------------------------------------------------

export interface ReadableView extends Readable {
  Id: number,
  TitleText?: string,
  TitleTextMapHash?: number,
  Icon?: string,

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
  Index: number,
  IsAlternate: boolean,
  Localization: LocalizationExcelConfigData,
  LocalizationName: string,
  ReadableText: string,
  ReadableTextAsDialogue: string,
  ReadableTextAsTemplate: string,
  ReadableImages: string[],
  MainQuestTrigger?: MainQuestExcelConfigData,
  Markers?: {
    ReadableText?: Marker[],
    ReadableTextAsDialogue?: Marker[],
    ReadableTextAsTemplate?: Marker[],
  }
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
  PreviewPath: string,
  DocumentType?: 'Video' | undefined,
  VideoPath?: string,
  SubtitleId?: number,

  ContentLocalizedIds: number[],
  AltContentLocalizedQuestConds: number[], // Quest trigger condition for alternate
  AltContentLocalizedIds: number[], // Alternate ContentLocalizedIds
}
