import { escapeHtml } from '../../shared/util/stringUtil';
import { getFocusableSelector } from './domutil';

export const DIALOG_ALERT = 0;
export const DIALOG_MODAL = 1;
export const DIALOG_ERROR = 2;
export const DIALOG_TOAST = 3;
export const DIALOG_CONFIRM = 4;

export type DialogOpts = {
  disableDefaultCloseButton?: boolean,
  dialog_outer_class?: string,
  dialog_class?: string,
  dialog_style?: string,
  callback?: (el: HTMLElement) => void,
  disableEscToClose?: boolean,
  blocking?: boolean,
  onConfirm?: () => void,
  onCancel?: () => void,
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
          <div class="AppDialog_Content"></div>
          <div class="AppDialog_ButtonGroup">
            <button class="AppDialog_ConfirmButton secondary AppDialog_CloseTrigger" ui-action="close-modals">OK</button>
          </div>`;
  } else if (dialog_type == DIALOG_CONFIRM) {
      type_name = 'alert';
      inner = `
          <div class="AppDialog_Content"></div>
          <div class="AppDialog_ButtonGroup">
            <button class="AppDialog_ConfirmButton primary danger AppDialog_CloseTrigger" ui-action="close-modals">OK</button>
            <button class="AppDialog_CancelButton secondary focus-target AppDialog_CloseTrigger" ui-action="close-modals">Cancel</button>
          </div>`;
  } else if (dialog_type == DIALOG_MODAL) {
    type_name = 'modal';
    inner = `<div class="AppDialog_Content"></div>`;
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
          <div class="AppDialog_Content"></div>`;
    if (!opts.disableDefaultCloseButton) {
      inner += `<button class="close small AppDialog_CloseTrigger" aria-label="Close dialog" ui-action="close-modals"
          ui-tippy-hover="{content:'Keyboard shortcut: <strong>esc</strong>', delay:[100,100], allowHTML: true}"></button>`;
    }
  }

  const id = 'dialog-' + Date.now();

  document.body.insertAdjacentHTML('beforeend',
    `<div id="${id}" class="AppDialogOuter ${opts.dialog_outer_class || ''} ${opts.blocking ? 'AppDialogBlocking' : ''}"
          data-type="${type_name}" role="dialog">
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

  let confirmBtn = document.querySelector(`#${id} .AppDialog_ConfirmButton`);
  if (confirmBtn && opts.onConfirm) {
    confirmBtn.addEventListener('click', () => {
      opts.onConfirm();
    });
  }

  let cancelBtn = document.querySelector(`#${id} .AppDialog_CancelButton`);
  if (cancelBtn && opts.onConfirm) {
    cancelBtn.addEventListener('click', () => {
      opts.onCancel();
    });
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
      let focusTarget: HTMLElement = document.querySelector(`#${id} .focus-target`);
      if (!focusTarget) {
        focusTarget = document.querySelector(getFocusableSelector(`#${id}`));
      }
      if (focusTarget) {
        if (typeof focusTarget.focus === 'function')
          focusTarget.focus();
        if (typeof (<any> focusTarget).select === 'function')
          (<any> focusTarget).select();
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

(<any> window).openDialog = openDialog;