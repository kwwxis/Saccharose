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
}