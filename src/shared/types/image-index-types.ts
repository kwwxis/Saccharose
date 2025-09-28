import { SearchMode } from '../util/searchUtil.ts';
import { defaultMap } from '../util/genericUtil.ts';
import { GameVersions } from './game-versions.ts';

export interface ImageIndexExcelMeta {
  [excelFile: string]: ImageIndexExcelMetaEntry;
}

export interface ImageIndexExcelMetaEntry {
  usageCount: number,
  rows: number[]
}

export interface ImageIndexEntity {
  image_name: string,
  image_size: number,
  image_width: number,
  image_height: number,
  excel_usages: string[],
  excel_meta: ImageIndexExcelMeta,
  image_cats?: Record<string, string>,
  first_version?: string,
  extra_info?: ImageIndexExtraInfo
}

export interface ImageIndexExtraInfo {
  otherNames?: ImageIndexOtherName[]
}

export interface ImageIndexOtherName {
  name: string,
  size: number
}

export interface ImageIndexSearchParams {
  query?: string,
  cats?: Record<string, string>,
  catPath?: string,
  catRestrict?: boolean,
  versionFilter?: string|GameVersions,
  offset?: number,
  limit?: number,
  searchMode?: SearchMode,
}

export interface ImageIndexSearchResult {
  results: ImageIndexEntity[],
  hasMore: boolean,
  offset: number,
  nextOffset?: number
}

export interface ImageCategoryMap {
  name: string,
  newImageVersions: string[],
  children: ImageCategoryMapChildren
}

export interface ImageCategoryMapChildren {
  [catName: string]: ImageCategoryMap
}

export function newImageCategory(name: string): ImageCategoryMap {
  return {
    name: name,
    newImageVersions: [],
    children: defaultMap((subName: string) => newImageCategory(subName))
  };
}
