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
import { ExcelChangeRef, ReadableChangesGroup } from '../changelog-types.ts';
import { AvatarCostumeExcelConfigData, AvatarFlycloakExcelConfigData } from './avatar-types.ts';
import { GameVersion } from '../game-versions.ts';

// Search View
// --------------------------------------------------------------------------------------------------------------

export interface ReadableSearchResult {
  TitleResults: Readable[]
  ContentResults: Readable[]
}

export type ReadableLoadConf = {
  LoadReadableItems?: boolean | ((readable: Readable) => boolean),
  LoadAddedAt?: boolean,
};

// Book View
// --------------------------------------------------------------------------------------------------------------

export type ReadableVariantType = 'Material' | 'Artifact' | 'Weapon' | 'Flycloak' | 'Costume';
export type ReadableMetaType = 'BookSuit' | 'NonBookSuit' | 'BookCodex' | 'NonBookCodex';

export interface ReadableVariantInfo {
  VariantType: ReadableVariantType,
  TitleText?: string,
  TitleTextMapHash?: number,
  Icon?: string,
}

export interface Readable {
  // The ID of the DocumentExcelConfigData that this readable is based on. This is the primary key for the readable.
  Id: number,

  // The general type of the readable:
  VariantTypes: ReadableVariantType[],
  MetaTypes: ReadableMetaType[],

  // Fields taken from the type-specific ExcelConfigData, if available:
  PrimaryVariantTitleText?: string,
  PrimaryVariantTitleTextMapHash?: number,
  PrimaryVariantIcon?: string,
  Variants: {[variantType in ReadableVariantType]?: ReadableVariantInfo},

  // The following fields are always available, regardless of type:
  Document: DocumentExcelConfigData,
  Items: ReadableItem[],

  // Type=Material data:
  Material?: MaterialExcelConfigData,

  // BookSuit is for readables part of a collection. This is only checked for readables of type "Material"
  BookSuit?: BookSuitExcelConfigData,

  // Codex is if the readable is in the in-game Archive (which is internally called "Codex").
  BookCodex?: BooksCodexExcelConfigData,

  // Type=Artifact data:
  Artifact?: ReliquaryExcelConfigData,
  ArtifactSet?: ReliquarySetExcelConfigData,
  ArtifactCodex?: ReliquaryCodexExcelConfigData,

  // Type=Weapon data:
  Weapon?: WeaponExcelConfigData,

  // Type=Flycloak data:
  Flycloak?: AvatarFlycloakExcelConfigData;

  // Type=Costume data:
  Costume?: AvatarCostumeExcelConfigData;

  // The version at which this Readable (DocumentExcelConfigData) was first added to the game.
  AddedAtVersion?: GameVersion;
}

export interface ReadableArchive {
  TotalCount: number;
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
  },

  Images: string[]
}

export interface ReadableItem {
  Page: number,
  IsAlternate: boolean,
  Localization: LocalizationExcelConfigData,
  MainQuestTrigger?: MainQuestExcelConfigData,

  ReadableText: ReadableText,
  ReadableTextAllLanguages?: ReadableText[],
  ReadableChangesGroup: ReadableChangesGroup,
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

export const LANG_CODE_TO_LOCALIZATION_PATH_PROP_ENTRIES: {langCode: LangCode, pathVar: string}[] =
  Object.entries(LANG_CODE_TO_LOCALIZATION_PATH_PROP)
    .map(([langCode, pathVar]) => ({langCode: langCode as LangCode, pathVar}));

export interface LocalizationExcelConfigData {
  Id: number,
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
  DocumentType?: 'Letter' | 'Paged' | 'Video' | undefined,
  VideoPath?: string,
  SubtitleId?: number,

  ContentLocalizedIds: number[],
  QuestIdList: number[], // Quest trigger condition for alternate
  QuestContentLocalizedIds: number[], // Alternate ContentLocalizedIds

  AdditionalQuestIdList: number[],
  AdditionalQuestContentLocalizedIds: number[],
}
