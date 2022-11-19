import { escapeHtml } from '../../shared/util/stringUtil';
import { closeDialog, DIALOG_MODAL, openDialog } from './dialog';
import { copyToClipboard } from './domutil';

let handlingJavascriptError = false;

export function showJavascriptErrorDialog(message, source, lineno?: number, colno?: number, error?: any) {
  console.error(error || message);

  if (handlingJavascriptError) {
    return;
  }

  handlingJavascriptError = true;

  const searchAndRedact = (obj) => {
    if (typeof obj !== 'object' || !obj) return obj;
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object') {
        obj[key] = searchAndRedact(obj[key]);
      }
      switch (key.toLowerCase()) {
        case 'x-csrf-token':
        case '_csrf':
        case 'x-api-key':
        case 'connect.sid':
          obj[key] = '<REDACTED>';
      }
    });
    return obj;
  };

  let errorAsJSON = error ? searchAndRedact(JSON.parse(JSON.stringify(error))) : error;

  let technicalDetails = [
    'Message: ' + escapeHtml(String(message)),
    'Source: ' + escapeHtml(String(source)),
    'Line: ' + escapeHtml(String(lineno)),
    'Column: ' + escapeHtml(String(colno)),
    'Error object: ' + escapeHtml(JSON.stringify(errorAsJSON, null, 2)),
    'Stacktrace:\n' + escapeHtml(error ? error.stack : 'undefined'),
  ].join('\n');

  // Just in case:
  technicalDetails = technicalDetails.replace(/(['"])(x-api-key|x-csrf-token|_csrf|connect\.sid)(['"])(:\s*)(['"])([^ "']+)(['"])/gi, '$1$2$3$4$5<REDACTED>$7');

  openDialog(`<h2>Unexpected error</h2>
  <p class='spacer-top'>
  An unexpected JavaScript error occurred. Try again in a few moments. If the problem
  persists then yell at kwwxis with the technical details below.</p>
  <div class='js-error-details'>
    <button ui-trigger='js-error-details' aria-label='Toggle technical details'>Technical Details</button>
    <div class='hide' ui-target='js-error-details'>
      <button class='primary primary--2 copy-js-error-details spacer5-bottom'
        ui-tippy-hover='Click to copy technical details'
        ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
      <textarea readonly class='d-pre-code'>${technicalDetails}</textarea>
    </div>
  </div>
  <div class='buttons spacer-top'>
    <button class='primary dismiss-btn'>Dismiss</button>
  </div>`, DIALOG_MODAL, {
    dialog_outer_class: 'js-error',
    blocking: true,
    disableDefaultCloseButton: true,
    disableEscToClose: true,
    callback(element: HTMLElement) {
      element.querySelector('button.copy-js-error-details').addEventListener('click', () => {
        copyToClipboard(technicalDetails);
      });
      element.querySelector('button.dismiss-btn').addEventListener('click', () => {
        closeDialog();
        handlingJavascriptError = false;
      });
    }
  });

  return true;
}