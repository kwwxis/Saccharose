import SiteMode from '../userPreferences/siteMode.ts';
import { copyTextToClipboard, createElement, getInputValue } from '../../util/domutil.ts';
import { mwParse } from '../../../shared/mediawiki/mwParse.ts';
import { MwParamNode, MwTemplateNode } from '../../../shared/mediawiki/mwTypes.ts';
import { highlightWikitextReplace } from '../ace/wikitextEditor.ts';

export function enableOLActionsInterval() {

  document.querySelectorAll('.highlighted.ol-result-textarea:not(.ol-result-textarea-processed)').forEach(
    (contentEditableEl: HTMLElement) => {
      contentEditableEl.classList.add('ol-result-textarea-processed');

      if (!SiteMode.isGenshin) {
        return;
      }

      const newParent: HTMLElement = createElement('div', {class: 'posRel'});
      contentEditableEl.insertAdjacentElement('afterend', newParent);
      newParent.append(contentEditableEl);

      const toolbarEl = createElement('div', {
        class: 'posAbs',
        style: 'top: 0; right: 0; font-size: 0;'
      })

      const rmButton = createElement('button', {
        class: 'secondary small',
        text: 'Remove RM',
        style: 'border-bottom-right-radius: 0;'
      })

      const tlButton = createElement('button', {
        class: 'secondary small',
        text: 'Remove TL',
        style: `border-left: 0;border-bottom-left-radius: 0;`
      });

      toolbarEl.append(rmButton);
      toolbarEl.append(tlButton);

      if (contentEditableEl.classList.contains('ol-result-textarea--with-copy-button')) {
        const copyButton = createElement('button', {
          class: 'secondary small',
          text: 'Copy',
          style: `border-left: 0;border-bottom-left-radius: 0;`,
          'ui-tippy-hover': "Click to copy to clipboard",
          'ui-tippy-flash': "{content:'Copied!', delay: [0,2000]}",
        });
        copyButton.addEventListener('click', async () => {
          await copyTextToClipboard(contentEditableEl.querySelector('.ace_static_text_layer').textContent.trim());
        });
        toolbarEl.append(copyButton);
      }

      newParent.append(toolbarEl);

      const createParamRemover = (regex: RegExp, addDefaultHidden: boolean = false) => {
        return (event: MouseEvent) => {
          const text = getInputValue(contentEditableEl);
          const parsed = mwParse(text);
          let templateNode: MwTemplateNode = parsed.findTemplateNodes()
            .find(t => t.templateName.toLowerCase() === 'other_languages');
          templateNode.removeParams(regex);
          if (contentEditableEl.hasAttribute('data-markers')) {
            contentEditableEl.removeAttribute('data-markers');
          }
          templateNode.readjustPropPad(['default_hidden']);
          if (addDefaultHidden) {
            templateNode.getParam(0).afterValueWhitespace.content = '';
            templateNode.addParamAfter(new MwParamNode('|', 'default_hidden', '1', '', '\n'), 0);
          }
          contentEditableEl = highlightWikitextReplace(contentEditableEl, parsed.toString().trim());
          (<HTMLButtonElement> event.target).setAttribute('disabled', '');
        };
      }

      rmButton.addEventListener('click', createParamRemover(/_rm$/));
      tlButton.addEventListener('click', createParamRemover(/_tl$/, true));
    });
}
