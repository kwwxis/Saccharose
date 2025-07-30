import { SiteMode } from './site/site-mode-type.ts';
import { TextMapHash } from './lang-types.ts';
import { MwTemplateNode } from '../mediawiki/mwParseTypes.ts';
import { Marker } from '../util/highlightMarker.ts';

export type OLConfig = {
  hideTlOption?: boolean,
  hideRmOption?: boolean,
  hideOtherOptions?: boolean,
  neverDefaultHidden?: boolean,
};

export const OLConfigMap: Record<SiteMode, OLConfig> = {
  unset: {},
  genshin: {},
  hsr: {
    hideTlOption: true,
    neverDefaultHidden: true,
  },
  zenless: {
    hideTlOption: true,
    neverDefaultHidden: true,
  },
  wuwa: {
    hideTlOption: true,
    hideRmOption: true,
    hideOtherOptions: true,
    neverDefaultHidden: true,
  },
};

export interface OLResult {
  textMapHash: TextMapHash,
  result: string,
  warnings: string[],
  markers: Marker[],
  templateNode?: MwTemplateNode;
  duplicateTextMapHashes: TextMapHash[];
  suppressMarkers?: boolean,
}

export interface OLCombinedResult {
  textMapHashList: TextMapHash[],
  result: string,
  templateNode: MwTemplateNode
}
