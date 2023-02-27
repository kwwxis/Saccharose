import { escapeHtml } from '../../shared/util/stringUtil';
import { getFocusableSelector } from './domutil';

const TYPE_ALERT = 0;
const TYPE_MODAL = 1;
const TYPE_ERROR = 2;
const TYPE_TOAST = 3;
const TYPE_CONFIRM = 4;

export type ModalOpts = {
  disableDefaultCloseButton?: boolean,
  modalOuterClass?: string,
  modalClass?: string,
  modalCssStyle?: string,
  callback?: (modalEL: HTMLElement) => void,
  disableEscToClose?: boolean,
  blocking?: boolean,
  onConfirm?: (modalEL?: HTMLElement) => void,
  onCancel?: (modalEL?: HTMLElement) => void,
}

class ModalService {
  private modalsOpen = false;

  private active_listener = (e: KeyboardEvent) => {
    if (!this.modalsOpen) {
      return;
    }
    const tag = (<HTMLElement> e.target).tagName.toUpperCase();

    const key = e.which || e.keyCode || 0;
    if (key === 13 && tag != 'TEXTAREA' && tag != 'INPUT' && tag != 'SELECT' && tag != 'BUTTON') this.closeAll(); // Enter
    if (key === 27 && tag != 'TEXTAREA' && tag != 'INPUT' && tag != 'SELECT') this.closeAll(); // Escape
  };

  modal(contents: string|HTMLElement, opts: ModalOpts = {}) {
    this.open(contents, TYPE_MODAL, opts);
  }

  alert(contents: string|HTMLElement, opts: ModalOpts = {}) {
    this.open(contents, TYPE_ALERT, opts);
  }

  error(contents: string|HTMLElement, opts: ModalOpts = {}) {
    this.open(contents, TYPE_ERROR, opts);
  }

  toast(contents: string|HTMLElement, opts: ModalOpts = {}) {
    this.open(contents, TYPE_TOAST, opts);
  }

  confirm(contents: string|HTMLElement, opts: ModalOpts = {}) {
    this.open(contents, TYPE_CONFIRM, opts);
  }

  open(contents: string|HTMLElement, optType: number, opts: ModalOpts = {}) {
    this.closeAll();

    if (!contents) {
      return;
    }

    opts = opts || {};

    let inner, type_name;

    optType = optType || 0;

    if (optType == TYPE_ALERT) {
      type_name = 'alert';
      inner = `
          <div class="modal-content"></div>
          <div class="buttons spacer15-top">
            <button class="confirm secondary" ui-action="close-modals">OK</button>
          </div>`;
    } else if (optType == TYPE_CONFIRM) {
      type_name = 'alert';
      inner = `
          <div class="modal-content"></div>
          <div class="buttons spacer15-top">
            <button class="confirm primary" ui-action="close-modals">OK</button>
            <button class="cancel secondary focus-target" ui-action="close-modals">Cancel</button>
          </div>`;
    } else if (optType == TYPE_MODAL) {
      type_name = 'modal';
      inner = `<div class="modal-content"></div>`;
      if (!opts.disableDefaultCloseButton) {
        inner += `<button class="close small" aria-label="Close dialog" ui-action="close-modals"
          ui-tippy-hover="{content:'Keyboard shortcut: <strong>esc</strong>', delay:[100,100], allowHTML: true}"></button>`;
      }
    } else if (optType == TYPE_ERROR || optType == TYPE_TOAST) {
      type_name = 'toast';
      let iconHTML;
      if (optType === TYPE_ERROR) {
        iconHTML = document.getElementById('template-alert-icon').innerHTML;
      } else {
        iconHTML = document.getElementById('template-info-icon').innerHTML;
      }
      inner = `${iconHTML}
          <div class="modal-content"></div>`;
      if (!opts.disableDefaultCloseButton) {
        inner += `<button class="close small" aria-label="Close dialog" ui-action="close-modals"
          ui-tippy-hover="{content:'Keyboard shortcut: <strong>esc</strong>', delay:[100,100], allowHTML: true}"></button>`;
      }
    }

    const id = 'dialog-' + Date.now();

    document.body.insertAdjacentHTML('beforeend',
      `<div id="${id}" class="modal-outer${opts.modalOuterClass ? ' ' + opts.modalOuterClass : ''}${opts.blocking ? ' modal-blocking' : ''}"
          data-type="${type_name}" role="dialog">
        <div class="modal" data-type="${type_name}" ${opts.modalClass ? 'class="'+escapeHtml(opts.modalClass)+'"' : ''} ${opts.modalCssStyle ? 'style="'+escapeHtml(opts.modalCssStyle)+'"' : ''}>
          <div class="modal-inner">${inner}</div>
        </div>
      </div>`
    );

    if (contents instanceof Node) {
      document.querySelector(`#${id} .modal-content`).append(contents);
    } else {
      document.querySelector(`#${id} .modal-content`).innerHTML = contents;
    }

    let confirmBtn = document.querySelector(`#${id} .confirm`);
    if (confirmBtn && opts.onConfirm) {
      confirmBtn.addEventListener('click', () => {
        opts.onConfirm(document.getElementById(id));
      });
    }

    let cancelBtn = document.querySelector(`#${id} .cancel`);
    if (cancelBtn && opts.onConfirm) {
      cancelBtn.addEventListener('click', () => {
        opts.onCancel(document.getElementById(id));
      });
    }

    this.modalsOpen = true;

    if (opts.callback) {
      opts.callback.apply(null, [document.getElementById(id)]);
    }

    if (!opts.disableEscToClose) {
      setTimeout(() => document.body.addEventListener('keyup', this.active_listener.bind(this)), 100);
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

  closeAll() {
    this.modalsOpen = false;
    document.querySelectorAll('.modal-outer').forEach(el => el.remove());
    document.body.removeEventListener('keyup', this.active_listener.bind(this));
  }
}

export const modalService = new ModalService();