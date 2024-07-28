import { registerSiteIntervalFunction } from '../../core/siteEvents.ts';
import { ReadableText } from '../../../shared/types/genshin/readable-types.ts';
import { LangCode } from '../../../shared/types/lang-types.ts';
import { listen } from '../../util/eventListen.ts';
import { frag1 } from '../../util/domutil.ts';
import { Marker } from '../../../shared/util/highlightMarker.ts';

function readableTextModuleLoader() {
  for (let moduleEl of Array.from(document.querySelectorAll('.readable-text-module--not-loaded'))) {
    moduleEl.classList.remove('readable-text-module--not-loaded');
    moduleEl.classList.add('readable-text-module--loaded');

    const ref: string = moduleEl.getAttribute('data-ref');

    const textPanel: HTMLElement = moduleEl.querySelector('.tabpanel[data-for="text"]');
    const dialoguePanel: HTMLElement = moduleEl.querySelector('.tabpanel[data-for="dialogue"]');
    const templatePanel: HTMLElement = moduleEl.querySelector('.tabpanel[data-for="template"]');

    const textWikitextContainer: HTMLElement = textPanel.querySelector('.wikitext-container');
    const dialogueWikitextContainer: HTMLElement = dialoguePanel.querySelector('.wikitext-container');
    const templateWikitextContainer: HTMLElement = templatePanel.querySelector('.wikitext-container');

    const dataEl = moduleEl.querySelector<HTMLInputElement>('[name="readable-text-module-data"]');
    const expanded: ReadableText[] = JSON.parse(dataEl.value);
    dataEl.remove();

    function onLangSwitch() {
      const activeLangTab: HTMLElement = moduleEl.querySelector('.lang-switch-tab.active');
      const langCode: LangCode = activeLangTab.getAttribute('data-lang') as LangCode;

      const readableText: ReadableText = expanded.find(x => x.LangCode === langCode);
      moduleEl.querySelectorAll<HTMLElement>('.for-lang-path').forEach(el => el.innerText = readableText.LangPath);

      for (let container of [textWikitextContainer, dialogueWikitextContainer, templateWikitextContainer]) {
        const alreadyExistingWikitext: HTMLElement = container.querySelector(`.wikitext[data-lang="${langCode}"]`);

        container.querySelectorAll('.wikitext').forEach(el => {
          el.classList.add('hide');
          el.classList.remove('active');
        });

        if (alreadyExistingWikitext) {
          alreadyExistingWikitext.classList.remove('hide');
          alreadyExistingWikitext.classList.add('active');
          continue;
        }

        const containerFor: 'text' | 'dialogue' | 'template' = <any> container.getAttribute('data-for');

        let newWikitextEl: HTMLTextAreaElement;

        switch (containerFor) {
          case 'text':
            newWikitextEl = frag1(`
              <textarea id="wikitext-${ref}-text" readonly data-lang="${readableText.LangCode}"
                    class="w100p wikitext autosize active" spellcheck="false" translate="no"
                    style="padding-right:46px"></textarea>
            `);
            newWikitextEl.setAttribute('data-markers', Marker.joining(readableText.Markers?.AsNormal));
            newWikitextEl.value = readableText.AsNormal;
            break;
          case 'dialogue':
            newWikitextEl = frag1(`
              <textarea id="wikitext-${ref}-dialogue" readonly data-lang="${readableText.LangCode}"
                    class="w100p wikitext autosize active" spellcheck="false" translate="no"></textarea>;
            `)
            newWikitextEl.setAttribute('data-markers', Marker.joining(readableText.Markers?.AsDialogue));
            newWikitextEl.value = readableText.AsDialogue;
            break;
          case 'template':
            newWikitextEl = frag1(`
              <textarea id="wikitext-${ref}-template" readonly data-lang="${readableText.LangCode}"
                    class="w100p wikitext autosize active" spellcheck="false" translate="no"></textarea>
            `);
            newWikitextEl.setAttribute('data-markers', Marker.joining(readableText.Markers?.AsTemplate));
            newWikitextEl.value = readableText.AsTemplate;
            break;
        }

        container.append(newWikitextEl);
      }
    }

    listen([
      {
        selector: '.main-tab',
        event: 'click',
        multiple: true,
        handle(_event) {
          onLangSwitch();
        },
      },
      {
        selector: '.lang-switch-tab',
        event: 'click',
        multiple: true,
        handle(event) {
          const target: HTMLButtonElement = event.target as HTMLButtonElement;
          if (target.classList.contains('active')) {
            return;
          }
          moduleEl.querySelectorAll('.lang-switch-tab').forEach(el => el.classList.remove('active'));
          target.classList.add('active');
          onLangSwitch();
        },
      }
    ], moduleEl);
  }
}

registerSiteIntervalFunction(readableTextModuleLoader);
