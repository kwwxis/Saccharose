import { genshinEndpoints } from '../../../core/endpoints.ts';
import { pageMatch } from '../../../core/pageMatch.ts';
import { startGenericSearchPageListeners } from '../../genericSearchPage.ts';
import { listen } from '../../../util/eventListen.ts';
import { modalService } from '../../../util/modalService.ts';

pageMatch('vue/GenshinNpcDialoguePage', () => {
  startGenericSearchPageListeners({
    endpoint: genshinEndpoints.generateNpcDialogue,
    asHtml: true,

    inputs: [
      {
        selector: '.npc-dialogue-generate-input',
        apiParam: 'name',
        queryParam: 'q',
        pasteButton: '.npc-dialogue-generate-input-paste',
        clearButton: '.npc-dialogue-generate-input-clear',
      }
    ],

    submitPendingTarget: '.npc-dialogue-generate-submit-pending',
    submitButtonTarget: '.npc-dialogue-generate-submit',
    resultTarget: '#npc-dialogue-generate-result',
  });
  listen([
    {
      selector: '#npc-dialogue-info-button',
      event: 'click',
      handle(_event) {
        modalService.modal('Info', `
        <div class="content">
          <ul>
            <li>If you can't find the dialogue you're looking for, try entering part of the first line of the dialogue (if you have it) 
            into the "Single Branch Dialogue Generator" tool.</li>
            <li>It may not find results if the NPC is disguised as "???"</li>
            <li>Try the other tools if you can't find the dialogue you're looking for.</li>
            <li>You may get multiple NPC results with different IDs but the same name. This is generally the same "person" but in 
            the different conditions/situations/quest states. In other cases, it might actually be different people with the same 
            name &mdash; there's an "Iris" in Dragonspine and an "Iris" in Sumeru, for example.</li>
          </ul>
        </div>
        `);
      }
    }
  ])
});
