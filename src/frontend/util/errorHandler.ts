import { modalService } from './modalService.ts';
import { escapeHtml } from '../../shared/util/stringUtil.ts';

let handlingJavascriptError = false;

export function showJavascriptErrorDialog(message, source, lineno?: number, colno?: number, error?: any) {
  const msg = error || message;
  console.error('Javascript Error:', msg);

  if (typeof msg === 'string' && msg.includes('ResizeObserver')) {
    return;
  }

  if (handlingJavascriptError) {
    return;
  }

  handlingJavascriptError = true;

  let debugInfo = `Source:${source};Lineno:${lineno};Colno:${colno}\n${error}`;

  modalService.modal('Unexpected Error', `
    <p>
      An unexpected JavaScript error occurred. Try again in a few moments. If the problem
      persists then yell at kwwxis.
    </p>
    <textarea class="code w100p spacer5-top" style="height:50px">${escapeHtml(debugInfo)}</textarea>
  `).onClose(() => {
    handlingJavascriptError = false;
  })

  return true;
}

let handlingInternalError = false;

export function showInternalErrorDialog(data) {
  console.error('Internal Error:', data);

  if (handlingInternalError) {
    return;
  }

  handlingInternalError = true;

  modalService.modal('Internal Error', `
    <p>
      An internal server error occurred. Try again in a few moments. If the problem
      persists then yell at kwwxis.
    </p>
  `).onClose(() => {
    handlingInternalError = false;
  });

  return true;
}
