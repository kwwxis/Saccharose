import { DOMClassWatcher } from '../domClassWatcher';
import * as ace from 'brace';
import { aceEditors } from './wikitextEditor';
import { runWhenDOMContentLoaded, startListeners } from '../eventLoader';
import { SITE_MODE_WIKI_DOMAIN } from '../../siteMode';

let createdDomClassWatcher = false;

export function createAceDomClassWatcher() {
  if (!createdDomClassWatcher) {
    createdDomClassWatcher = true;
    new DOMClassWatcher('body', 'nightmode',
      () => {
        aceEditors.forEach(editor => editor.setTheme('ace/theme/tomorrow_night'));

        let TomorrowNightTheme = ace.acequire('ace/theme/tomorrow_night');
        let TextmateTheme = ace.acequire('ace/theme/textmate');
        document.querySelectorAll('.highlighted').forEach(el => {
          el.classList.remove(TextmateTheme.cssClass);
          el.classList.add(TomorrowNightTheme.cssClass);
        });
      },
      () => {
        aceEditors.forEach(editor => editor.setTheme('ace/theme/textmate'));

        let TomorrowNightTheme = ace.acequire('ace/theme/tomorrow_night');
        let TextmateTheme = ace.acequire('ace/theme/textmate');
        document.querySelectorAll('.highlighted').forEach(el => {
          el.classList.remove(TomorrowNightTheme.cssClass);
          el.classList.add(TextmateTheme.cssClass);
        });
      });
  }
}
/*
runWhenDOMContentLoaded(() => {
  startListeners([
    {
      el: document,
      ev: 'click',
      fn: function(event: KeyboardEvent) {
        if (!(event.ctrlKey || event.metaKey || event.altKey) || !event.target || typeof event.target['closest'] !== 'function') {
          return;
        }

        let target: HTMLElement = event.target as HTMLElement;
        let token = target.closest('.ace_template-name, .ace_link-name');

        if (token) {
          const url = token.getAttribute('data-href');
          if (url) {
            window.open(url, '_blank');
          }
        }
      }
    }
  ]);
});*/
