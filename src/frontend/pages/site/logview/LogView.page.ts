import { pageMatch } from '../../../core/pageMatch.ts';
import { wsc } from '../../../websocket/wsclient.ts';
import { LogViewLine } from '../../../../shared/types/wss-types.ts';
import { LogViewEntity } from '../../../../shared/types/site/site-logview-types.ts';
import { frag } from '../../../util/domutil.ts';
import './logview.scss';

pageMatch('vue/SiteLogViewPage', () => {
  const mainContainer: HTMLDivElement = document.querySelector('#site-logview');

  mainContainer.append(frag(`
    <div class="logview-row for-header">
      <div class="logview-cell for-timestamp">Timestamp</div>
      <div class="logview-cell for-wiki-user">Wiki User</div>
      <div class="logview-cell for-input-lang">Input Lang</div>
      <div class="logview-cell for-output-lang">Output Lang</div>
      <div class="logview-cell for-search-mode">Search Mode</div>
      <div class="logview-cell for-http-status">HTTP Status</div>
      <div class="logview-cell for-http-method">HTTP Method</div>
      <div class="logview-cell for-http-uri">HTTP URI</div>
      <div class="logview-cell for-http-runtime">HTTP Runtime</div>
    </div>
  `));

  // wsc.open();
  //
  // wsc.subscribe('LogViewLine', (data: LogViewLine) => {
  //   const lines: LogViewEntity[] = data.lines;
  // });
});
