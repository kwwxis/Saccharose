import { genshinEndpoints } from '../../../core/endpoints.ts';
import { pageMatch } from '../../../core/pageMatch.ts';
import { startGenericSearchPageListeners } from '../../genericSearchPage.ts';
import './branch-dialogue.scss';
import { listen } from '../../../util/eventListen.ts';

pageMatch('vue/GenshinBranchDialoguePage', () => {
  startGenericSearchPageListeners({
    endpoint: genshinEndpoints.generateSingleDialogueBranch,
    asHtml: true,

    inputs: [
      {
        selector: '.dialogue-generate-input',
        apiParam: 'text',
        queryParam: 'q',
        pasteButton: '.dialogue-generate-input-paste',
        clearButton: '.dialogue-generate-input-clear',
      },
      {
        selector: '.npc-filter-input',
        apiParam: 'npcFilter',
        queryParam: 'npc',
        clearButton: '.npc-filter-input-clear',
      },
      {
        selector: '#voicedOnly',
        apiParam: 'voicedOnly',
        queryParam: 'voicedOnly',
      },
      {
        selector: '#versionFilter',
        apiParam: 'versionFilter',
        queryParam: 'versions',
      }
    ],

    submitPendingTarget: '.dialogue-generate-submit-pending',
    submitButtonTarget: '.dialogue-generate-submit',
    resultTarget: '#dialogue-generate-result',
  });

  listen([
    {
      selector: '#versionFilterEnabled',
      event: 'input',
      handle(_ev) {
        const checkbox = document.querySelector<HTMLInputElement>('#versionFilterEnabled');
        if (checkbox.checked) {
          document.querySelector('#versionFilterOuter').classList.remove('hide');
        } else {
          document.querySelector('#versionFilterOuter').classList.add('hide');
        }
      }
    }
  ]);
});
