import { pageMatch } from '../../../core/pageMatch.ts';
import { wsc } from '../../../websocket/wsclient.ts';
import { LogViewLine } from '../../../../shared/types/wss-types.ts';
import { LogViewEntity } from '../../../../shared/types/site/site-logview-types.ts';
import { frag, frag1 } from '../../../util/domutil.ts';
import './logview.scss';
import { escapeHtml } from '../../../../shared/util/stringUtil.ts';
import { humanTiming, printHumanTiming } from '../../../../shared/util/genericUtil.ts';

pageMatch('vue/SiteLogViewPage', () => {
  const mainContainer: HTMLDivElement = document.querySelector('#site-logview');

  mainContainer.append(frag1(`
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

  wsc.open();

  wsc.subscribe('LogViewLine', (data: LogViewLine) => {
    const lines: LogViewEntity[] = data.lines;
    console.log('LogViewLine', lines);

    let elements: Element[] = [];
    for (let line of lines) {
      elements.push(frag1(`
        <div class="logview-row">
          <div class="logview-cell for-timestamp">${printHumanTiming(line.timestamp)}</div>
          <div class="logview-cell for-wiki-user">${escapeHtml(line.wiki_user)}</div>
          <div class="logview-cell for-input-lang">${escapeHtml(line.lang_in)}</div>
          <div class="logview-cell for-output-lang">${escapeHtml(line.lang_out)}</div>
          <div class="logview-cell for-search-mode">${escapeHtml(line.search_mode)}</div>
          <div class="logview-cell for-http-status">${escapeHtml(line.http_status)}</div>
          <div class="logview-cell for-http-method">${escapeHtml(line.http_method)}</div>
          <div class="logview-cell for-http-uri">${escapeHtml(line.http_uri)}</div>
          <div class="logview-cell for-http-runtime">${escapeHtml(line.http_runtime)}</div>
        </div>
      `));
    }
    mainContainer.append(...elements);
  });
});
