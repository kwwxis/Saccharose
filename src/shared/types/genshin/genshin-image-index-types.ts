
export interface GenshinImageIndexExcelMeta {
  [excelFile: string]: GenshinImageIndexExcelMetaEntry;
}

export interface GenshinImageIndexExcelMetaEntry {
  usageCount: number,
  rows: number[]
}

export interface GenshinImageIndexEntity {
  image_name: string,
  image_fts_name: string,
  image_size: number,
  excel_usages: string[],
  excel_meta: GenshinImageIndexExcelMeta,
  image_cat1?: string,
  image_cat2?: string,
  image_cat3?: string,
  image_cat4?: string,
  image_cat5?: string,
}

export interface GenshinImageIndexSearchResult {
  results: GenshinImageIndexEntity[],
  hasMore: boolean,
  offset: number,
  nextOffset?: number
}

export interface GenshinImageCategoryMap {
  [catName: string]: GenshinImageCategoryMap
}
