import { onSiteThemeChange } from '../userPreferences/siteTheme.ts';
import { aceEditors } from './aceEditor.ts';
import * as ace from 'brace';

let createdDomClassWatcher = false;

export function initAceThemeWatcher() {
  if (!createdDomClassWatcher) {
    createdDomClassWatcher = true;
    onSiteThemeChange(theme => {
      if (theme === 'nightmode') {
        aceEditors.forEach(editor => editor.setTheme('ace/theme/tomorrow_night'));

        let TomorrowNightTheme = ace.acequire('ace/theme/tomorrow_night');
        let TextmateTheme = ace.acequire('ace/theme/textmate');
        document.querySelectorAll('.highlighted').forEach(el => {
          el.classList.remove(TextmateTheme.cssClass);
          el.classList.add(TomorrowNightTheme.cssClass);
        });
      } else {
        aceEditors.forEach(editor => editor.setTheme('ace/theme/textmate'));

        let TomorrowNightTheme = ace.acequire('ace/theme/tomorrow_night');
        let TextmateTheme = ace.acequire('ace/theme/textmate');
        document.querySelectorAll('.highlighted').forEach(el => {
          el.classList.remove(TomorrowNightTheme.cssClass);
          el.classList.add(TextmateTheme.cssClass);
        });
      }
    });
  }
}
