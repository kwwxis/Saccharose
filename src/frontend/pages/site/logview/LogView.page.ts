import { pageMatch } from '../../../core/pageMatch.ts';
import { wsc } from '../../../websocket/wsclient.ts';
import { LogViewLine, LogViewRequest } from '../../../../shared/types/wss-types.ts';
import { LogViewEntity } from '../../../../shared/types/site/site-logview-types.ts';
import { frag, frag1, getScrollbarWidth } from '../../../util/domutil.ts';
import './logview.scss';
import { escapeHtml } from '../../../../shared/util/stringUtil.ts';
import { humanTiming, printHumanTiming } from '../../../../shared/util/genericUtil.ts';
import moment from 'moment';
import { uuidv4 } from '../../../../shared/util/uuidv4.ts';
import { css } from 'webpack';

pageMatch('vue/SiteLogViewPage', () => {
  const mainContainer: HTMLDivElement = document.querySelector('#site-logview');
  const myId: string = uuidv4();

  const scrollbarWidth = getScrollbarWidth();
  mainContainer.append(frag(`
    <div class="logview-row for-header" style="margin-right:${scrollbarWidth}px">
      <div class="logview-cell for-timestamp">Timestamp</div>
      <div class="logview-cell for-wiki-user">Wiki User</div>
      <div class="logview-cell for-mode" title="(Input Lang):(Output Lang):(Search Mode)">User Modes</div>
      <div class="logview-cell for-http-status">HTTP Status</div>
      <div class="logview-cell for-http-method">HTTP Method</div>
      <div class="logview-cell for-http-uri">HTTP URI</div>
      <div class="logview-cell for-http-runtime" title="In milliseconds">HTTP Runtime</div>
    </div>
    <div id="site-logview-body"></div>
  `));

  const scrollContainer: HTMLDivElement = document.querySelector('#site-logview-body');

  wsc.open();

  let didInitialLoad: boolean = false;

  wsc.subscribe('LogViewLine', (data: LogViewLine) => {
    const lines: LogViewEntity[] = data.lines;
    const fromRequest: LogViewRequest = data.fromRequest;

    if (fromRequest && fromRequest.requestId !== myId) {
      return;
    }

    if (!fromRequest && !didInitialLoad) {
      return;
    }

    const isScrolledToBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 5;
    console.log('LogViewLine', lines);

    let elements: Element[] = [];
    for (let line of lines) {
      const cssClasses: string[] = [];

      let apiOrWeb = '';
      if (line.http_uri.startsWith('/api')) {
        apiOrWeb = 'api';
      } else {
        apiOrWeb = 'web';
      }

      cssClasses.push('for-http-' + apiOrWeb);

      if (/^(\/api)?\/genshin/.test(line.http_uri)) {
        cssClasses.push(`for-genshin`);
        cssClasses.push(`for-genshin-${apiOrWeb}`);
      } else if (/^(\/api)?\/hsr/.test(line.http_uri)) {
        cssClasses.push(`for-hsr`);
        cssClasses.push(`for-hsr-${apiOrWeb}`);
      } else if (/^(\/api)?\/zenless/.test(line.http_uri)) {
        cssClasses.push(`for-zenless`);
        cssClasses.push(`for-zenless-${apiOrWeb}`);
      } else if (/^(\/api)?\/wuwa/.test(line.http_uri)) {
        cssClasses.push(`for-wuwa`);
        cssClasses.push(`for-wuwa-${apiOrWeb}`);
      }
      if (!fromRequest) {
        cssClasses.push('flash');
      }

      elements.push(frag1(`
        <div id="logview-${line.sha_hash}" class="logview-row ${cssClasses.join(' ')}" data-hash="${line.sha_hash}">
          <div class="logview-cell for-timestamp">${printHumanTiming(line.timestamp)}</div>
          <div class="logview-cell for-wiki-user">${escapeHtml(line.wiki_user || '(Guest)')}</div>
          <div class="logview-cell for-mode">${escapeHtml(line.lang_in)}:${escapeHtml(line.lang_out)}:${escapeHtml(line.search_mode)}</div>
          <div class="logview-cell for-http-status">${escapeHtml(line.http_status)}</div>
          <div class="logview-cell for-http-method">${escapeHtml(line.http_method)}</div>
          <div class="logview-cell for-http-uri">${escapeHtml(line.http_uri)}</div>
          <div class="logview-cell for-http-runtime">${escapeHtml(line.http_runtime)}</div>
        </div>
      `));
    }
    scrollContainer.append(...elements);

    if (isScrolledToBottom || (fromRequest && fromRequest.requestNote === 'initial')) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }

    if (fromRequest && fromRequest.requestNote === 'initial') {
      didInitialLoad = true;
    }
  });

  wsc.send('LogViewRequest', {
    requestId: myId,
    requestNote: 'initial',
    lowerbound: moment().subtract(1, 'days').toISOString(),
  })
});
