export interface ConfigCondition<T extends string = string> {
  Type?: T,
  Param?: (string|number)[]
  Count?: string,
  ParamStr?: string,
}

export interface GenshinImage {
  originalName: string,
  downloadName: string,
}

export interface SpriteTagExcelConfigData {
  Id: number,
  Image: string,
}

export interface HyperLinkNameExcelConifgData {
  Id: number,
  Color: string,

  NameText: string,
  NameTextMapHash: number,

  DescText: string,
  DescTextMapHash: number,
  DescParamList: string[],
}

export interface FeatureTagExcelConfigData {
  TagId: number,
  FeatureTagEnum: string,
  GroupIds?: number[],
}

export interface FeatureTagGroupExcelConfigData {
  GroupId: number,
  TagIds: number[],
}
