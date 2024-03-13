import { Listener } from '../../util/eventListen.ts';
import { GeneralEventBus } from '../generalEventBus.ts';
import { USER_PREFS, setUserPref } from './sitePrefsContainer.ts';

export type SiteTheme = 'daymode' | 'nightmode';

export function isNightmode(): boolean {
  return USER_PREFS.isNightmode || false;
}

export function isDaymode(): boolean {
  return !isNightmode();
}

export function onSiteThemeChange(listener: (theme: SiteTheme) => void) {
  GeneralEventBus.on('SiteThemeChange', listener);
}

export function offSiteThemeChange(listener: (theme: SiteTheme) => void) {
  GeneralEventBus.off('SiteThemeChange', listener);
}

export function setSiteTheme(theme: SiteTheme) {
  setUserPref('isNightmode', theme === 'nightmode').then(() => {
    console.log('Site theme changed to:', theme);
    GeneralEventBus.emit('SiteThemeChange', theme);

    document.querySelectorAll<HTMLButtonElement>('.toggle-theme-buttons button').forEach(el => {
      if (el.value === theme) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });

    if (theme === 'daymode') {
      document.body.classList.remove('nightmode');
      document.documentElement.classList.remove('nightmode');
      document.querySelectorAll('.os-scrollbar').forEach(scrollbar => {
        scrollbar.classList.remove('os-theme-light');
        scrollbar.classList.add('os-theme-dark');
      });
    } else if (theme === 'nightmode') {
      document.body.classList.add('nightmode');
      document.documentElement.classList.add('nightmode');
      document.querySelectorAll('.os-scrollbar').forEach(scrollbar => {
        scrollbar.classList.remove('os-theme-dark');
        scrollbar.classList.add('os-theme-light');
      });
    }
  });
}

export const SiteThemeListener: Listener = {
  selector: '.toggle-theme-buttons button',
  event: 'click',
  multiple: true,
  handle: function(_event: MouseEvent, target: HTMLButtonElement) {
    setSiteTheme(target.value as any);
  }
};
