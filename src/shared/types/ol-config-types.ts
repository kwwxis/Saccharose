import { SiteMode } from './site/site-mode-type.ts';

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
