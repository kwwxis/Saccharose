import { genshinEndpoints } from '../../../core/endpoints.ts';
import { pageMatch } from '../../../core/pageMatch.ts';
import { startGenericSearchPageListeners } from '../../genericSearchPage.ts';
import { modalService } from '../../../util/modalService.ts';
import { listen } from '../../../util/eventListen.ts';

pageMatch('vue/GenshinVoToDialoguePage', () => {
  startGenericSearchPageListeners({
    endpoint: genshinEndpoints.voToDialogue,
    doPost: true,
    asHtml: true,

    inputs: [
      {
        selector: '.search-input',
        apiParam: 'text',
        disableEnterKeySubmit: true
      }
    ],

    submitPendingTarget: '.search-submit-pending',
    submitButtonTarget: '.search-submit',
    resultTarget: '#search-result',
  });

  listen([
    {
      selector: '#vo-to-dialogue-info-button',
      event: 'click',
      handle(_event) {
        modalService.modal('Info', `
          <p><b>Accepted format:</b> case-insensitive, underscores or spaces,
            "<code>File:</code>" prefix optional, "<code>.ogg</code>" extension optional, can be in the
            <span style="white-space: nowrap">"<WikiTemplateLink name="A" />"</span>
            template with or without additional parameters.</p>
            
          <p>Examples:</p>
          <ul style="padding-left:25px">
            <li><code>vo mdaq006 3 paimon 01.ogg</code></li>
            <li><code>File:vo_mdaq006_3_paimon_01.ogg</code> </li>
            <li><code>{{A|vo mdaq006 3 paimon 01.ogg}}</code></li>
          </ul>
          
          <hr class="spacer10-vert" />
          
          <p><b>Regex Option:</b> Alternatively, you can search against all VO file names with a regex by starting and
          ending a line with a slash (<code>/</code>).</p>
          
          <p>Example: <code>/^vo dialog anecdote part1/</code></p>
          
          <p>You can use regex searches together with non-regex searches.</p>
          
          <hr class="spacer10-vert" />
          
          <p>Currently only supports showing the text for dialogue and reminders,
            other types such as fetters will only show the type and ID.</p>
        `);
      }
    }
  ]);
});
