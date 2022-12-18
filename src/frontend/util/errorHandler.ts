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

  openDialog(`
    <h2>Unexpected error</h2>
    <p class='spacer15-top'>
      An unexpected JavaScript error occurred. Try again in a few moments. If the problem
      persists then yell at kwwxis.
    </p>
    <div class='buttons spacer15-top'>
      <button class='primary dismiss-btn'>Dismiss</button>
    </div>
  `, DIALOG_MODAL, {
    dialog_outer_class: 'js-error',
    blocking: true,
    disableDefaultCloseButton: true,
    disableEscToClose: true,
    callback(element: HTMLElement) {
      element.querySelector('button.dismiss-btn').addEventListener('click', () => {
        closeDialog();
        handlingJavascriptError = false;
      });
    }
  });

  return true;
}