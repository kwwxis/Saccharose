import { escapeHtml } from '../../shared/util/stringUtil';
import { modalService } from './modalService';
import { copyToClipboard } from './domutil';

let handlingJavascriptError = false;

export function showJavascriptErrorDialog(message, source, lineno?: number, colno?: number, error?: any) {
  console.error('Javascript Error:', error || message);

  if (handlingJavascriptError) {
    return;
  }

  handlingJavascriptError = true;

  modalService.modal(`
    <h2>Unexpected error</h2>
    <p class='spacer15-top'>
      An unexpected JavaScript error occurred. Try again in a few moments. If the problem
      persists then yell at kwwxis.
    </p>
    <div class='buttons spacer15-top'>
      <button class='primary dismiss-btn'>Dismiss</button>
    </div>
  `, {
    blocking: true,
    disableDefaultCloseButton: true,
    disableEscToClose: true,
    callback(element: HTMLElement) {
      element.querySelector('button.dismiss-btn').addEventListener('click', () => {
        modalService.closeAll();
        handlingJavascriptError = false;
      });
    }
  });

  return true;
}

let handlingInternalError = false;

export function showInternalErrorDialog(data) {
  console.error('Internal Error:', data);

  if (handlingInternalError) {
    return;
  }

  handlingInternalError = true;

  modalService.modal(`
    <h2>Internal error</h2>
    <p class='spacer15-top'>
      An internal server error occurred. Try again in a few moments. If the problem
      persists then yell at kwwxis.
    </p>
    <div class='buttons spacer15-top'>
      <button class='primary dismiss-btn'>Dismiss</button>
    </div>
  `, {
    blocking: true,
    disableDefaultCloseButton: true,
    disableEscToClose: true,
    callback(element: HTMLElement) {
      element.querySelector('button.dismiss-btn').addEventListener('click', () => {
        modalService.closeAll();
        handlingInternalError = false;
      });
    }
  });

  return true;
}