import { runWhenDOMContentLoaded, listen } from '../util/eventListen.ts';
import { SiteThemeListener } from './userPreferences/siteTheme.ts';
import { SiteLanguageListener } from './userPreferences/siteLanguage.ts';
import { UIActionListener } from './generalEvents/uiActions.ts';
import { BodyKeyEvents } from './generalEvents/bodyKeyEvents.ts';
import { FileFormatListeners } from './generalEvents/fileFormatEvents.ts';
import { DesktopStickerHeaderListeners, recalculateDesktopStickyHeader } from './generalEvents/desktopStickyHeader.ts';
import { SiteSearchModeListener } from './userPreferences/siteSearchMode.ts';
import enableErrorListeners from './readyActions/enableErrorListeners.ts';
import enableUriChecks from './readyActions/enableUriChecks.ts';
import enableAxiosCsrf from './readyActions/enableAxiosCsrf.ts';
import enableMobileMenuCSS from './readyActions/enableMobileMenuCSS.ts';
import { enableSiteModePreferredBasePathAdjuster } from './readyActions/siteModePreferredBasePathAdjuster.ts';
import { tooltipInterval } from './intervalActions/tooltipInterval.ts';
import { timestampInterval } from './intervalActions/timestampInterval.ts';
import { enableReadonlyInterval } from './intervalActions/enableReadonlyInterval.ts';
import { enableOLActionsInterval } from './intervalActions/enableOLActionsInterval.ts';
import { enableAceInterval } from './intervalActions/enableAceInterval.ts';
import { wsc } from '../websocket/ws-client.ts';
import { enableStandardDiffUIInterval } from './intervalActions/enableStandardDiffUIInterval.ts';
import { enableMiscIntervals } from './intervalActions/miscIntervals.ts';

const SITE_INTERVAL_MS: number = 500;

const otherIntervalFunctions: Function[] = [];

export function registerSiteIntervalFunction(fn: Function) {
  otherIntervalFunctions.push(fn);
}

function siteIntervalFunction() {
  enableAceInterval();
  tooltipInterval();
  enableReadonlyInterval();
  enableOLActionsInterval();
  timestampInterval();
  enableStandardDiffUIInterval();
  enableMiscIntervals();
  for (let otherIntervalFunction of otherIntervalFunctions) {
    otherIntervalFunction();
  }
}

runWhenDOMContentLoaded(() => {
  enableAxiosCsrf();
  enableErrorListeners();
  // wsc.open();

  enableUriChecks();
  enableMobileMenuCSS();
  enableSiteModePreferredBasePathAdjuster();
  recalculateDesktopStickyHeader();

  siteIntervalFunction(); // run immediately at start
  setInterval(siteIntervalFunction, SITE_INTERVAL_MS);

  listen([
    ... BodyKeyEvents,
    UIActionListener,
    SiteThemeListener,
    SiteLanguageListener,
    SiteSearchModeListener,
    ... FileFormatListeners,
    ... DesktopStickerHeaderListeners,
  ], document);
});
