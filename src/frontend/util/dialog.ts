import { escapeHtml } from '../../shared/util/stringUtil';
import { getFocusableSelector } from './domutil';

export const DIALOG_ALERT = 0;
export const DIALOG_MODAL = 1;
export const DIALOG_ERROR = 2;
export const DIALOG_TOAST = 3;

export type DialogOpts = {
  disableDefaultCloseButton?: boolean,
  dialog_outer_class?: string,
  dialog_class?: string,
  dialog_style?: string,
  callback?: (el: HTMLElement) => void,
  disableEscToClose?: boolean,
  blocking?: boolean,
}

let modalsOpen = false;

export function openDialog(contents: string|HTMLElement, dialog_type: number, opts: DialogOpts = {}) {
  closeDialog();

  if (!contents) {
    return;
  }

  opts = opts || {};

  let inner, type_name;

  dialog_type = dialog_type || 0;

  if (dialog_type == DIALOG_ALERT) {
    type_name = 'alert';
    inner = `
          <div id="appDialogDesc" class="AppDialog_Content"></div>
          <div class="AppDialog_ButtonGroup">
            <button class="secondary AppDialog_CloseTrigger" ui-action="close-modals">OK</button>
          </div>`;
  } else if (dialog_type == DIALOG_MODAL) {
    type_name = 'modal';
    inner = `<div id="appDialogDesc" class="AppDialog_Content"></div>`;
    if (!opts.disableDefaultCloseButton) {
      inner += `<button class="close small AppDialog_CloseTrigger" aria-label="Close dialog" ui-action="close-modals"
          ui-tippy-hover="{content:'Keyboard shortcut: <strong>esc</strong>', delay:[100,100], allowHTML: true}"></button>`;
    }
  } else if (dialog_type == DIALOG_ERROR || dialog_type == DIALOG_TOAST) {
    type_name = 'toast';
    let iconHTML = '';
    if (dialog_type === DIALOG_ERROR) {
      iconHTML = document.getElementById('template-alert-icon').innerHTML;
    } else {
      iconHTML = document.getElementById('template-info-icon').innerHTML;
    }
    inner = `${iconHTML}
          <div id="appDialogDesc" class="AppDialog_Content"></div>`;
    if (!opts.disableDefaultCloseButton) {
      inner += `<button class="close small AppDialog_CloseTrigger" aria-label="Close dialog" ui-action="close-modals"
          ui-tippy-hover="{content:'Keyboard shortcut: <strong>esc</strong>', delay:[100,100], allowHTML: true}"></button>`;
    }
  }

  const id = 'dialog-' + Date.now();

  document.body.insertAdjacentHTML('beforeend',
    `<div id="${id}" class="AppDialogOuter ${opts.dialog_outer_class || ''} ${opts.blocking ? 'AppDialogBlocking' : ''}"
          data-type="${type_name}" role="dialog" aria-describedby="appDialogDesc">
        <div class="AppDialog" data-type="${type_name}" ${opts.dialog_class ? 'class="'+escapeHtml(opts.dialog_class)+'"' : ''} ${opts.dialog_style ? 'style="'+escapeHtml(opts.dialog_style)+'"' : ''}>
          <div class="AppDialog_Inner">${inner}</div>
        </div>
      </div>`
  );

  if (contents instanceof Node) {
    document.querySelector(`#${id} .AppDialog_Content`).append(contents);
  } else {
    document.querySelector(`#${id} .AppDialog_Content`).innerHTML = contents;
  }

  modalsOpen = true;

  if (opts.callback) {
    opts.callback.apply(null, [document.getElementById(id)]);
  }

  if (!opts.disableEscToClose) {
    setTimeout(() => document.body.addEventListener('keyup', active_listener), 100);
  }

  setTimeout(() => {
    window.requestAnimationFrame(function() {
      const selInput: HTMLElement = document.querySelector(getFocusableSelector(`#${id}`));
      if (selInput) {
        if (typeof selInput.focus === 'function')
          selInput.focus();
        if (typeof (<any> selInput).select === 'function')
          (<any> selInput).select();
      }
    });
  });
}

const active_listener = function(e: KeyboardEvent) {
  if (!modalsOpen) {
    return;
  }
  const tag = (<HTMLElement> e.target).tagName.toUpperCase();

  const key = e.which || e.keyCode || 0;
  if (key === 13 && tag != 'TEXTAREA' && tag != 'INPUT' && tag != 'SELECT' && tag != 'BUTTON') closeDialog(); // Enter
  if (key === 27 && tag != 'TEXTAREA' && tag != 'INPUT' && tag != 'SELECT') closeDialog(); // Escape
};

export function closeDialog() {
  modalsOpen = false;
  document.querySelectorAll('.AppDialogOuter').forEach(el => el.remove());
  document.body.removeEventListener('keyup', active_listener);
}