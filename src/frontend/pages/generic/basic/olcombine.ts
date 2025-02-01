import { pageMatch } from '../../../core/pageMatch.ts';
import { getOLCombineEndpoint } from '../../../core/endpoints.ts';
import * as ace from 'brace';
import { createWikitextEditor } from '../../../core/ace/aceEditor.ts';
import { listen } from '../../../util/eventListen.ts';

pageMatch('vue/OLCombinePage', () => {
  const editor: ace.Editor = createWikitextEditor('ol-combine-input');

  listen([
    {
      selector: '.ol-combine-submit',
      event: 'click',
      handle() {
        document.querySelector('.ol-combine-submit-pending').classList.remove('hide');
        getOLCombineEndpoint().send(null, {text: editor.getValue()}, true).then(result => {
          document.querySelector('#ol-combine-result').innerHTML = result;
        }).finally(() => {
          document.querySelector('.ol-combine-submit-pending').classList.add('hide');
        })
      }
    }
  ]);
});
