import { EventBus } from '../util/eventBus.ts';
import { SiteTheme } from './userPreferences/siteTheme.ts';
import { LangCode } from '../../shared/types/lang-types.ts';

export const GeneralEventBus = new EventBus<{
  'TabChange': [GeneralTabEvent],
  'SiteThemeChange': [SiteTheme],
  'inputLangCodeChanged': [LangCode],
  'outputLangCodeChanged': [LangCode],
}>('Generic-Events');

export type GeneralTabEvent = {
  /**
   * Tab group name.
   */
  tabgroup: string,

  /**
   * The tab button that was selected.
   */
  tab: HTMLElement,

  /**
   * The tab panel that was selected.
   */
  tabpanel: HTMLElement,

  /**
   * The other tabs in the same tab group, not including the tab that was selected.
   */
  otherTabs: { tab: HTMLElement, tabpanel: HTMLElement }[],
};


