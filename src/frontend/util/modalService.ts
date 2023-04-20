import { escapeHtml } from '../../shared/util/stringUtil';
import { getFocusableSelector } from './domutil';

const TYPE_ALERT = 0;
const TYPE_MODAL = 1;
const TYPE_CONFIRM = 4;

export type ModalOpts = {
  // CSS:
  modalOuterClass?: string,
  modalClass?: string,
  modalCssStyle?: string,
  contentClass?: string,

  callback?: (modalEL: HTMLElement) => void,
  disableEscToClose?: boolean,
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

  modal(header: string, contents: string|HTMLElement, opts: ModalOpts = {}) {
    this.open(header, contents, TYPE_MODAL, opts);
  }

  alert(header: string, contents: string|HTMLElement, opts: ModalOpts = {}) {
    this.open(header, contents, TYPE_ALERT, opts);
  }

  confirm(header: string, contents: string|HTMLElement, opts: ModalOpts = {}) {
    this.open(header, contents, TYPE_CONFIRM, opts);
  }

  open(header: string, contents: string|HTMLElement, optType: number, opts: ModalOpts = {}) {
    if (!header || !contents) return;
    this.closeAll();
    opts = opts || {};
    optType = optType || 0;

    let inner = `
      <div class="modal-header">
        ${header}
        <button class="modal-close cancel close small" aria-label="Close dialog" ui-action="close-modals"
            ui-tippy-hover="{content:'Keyboard shortcut: <strong>esc</strong>', delay:[100,100], allowHTML: true}"></button>
      </div>
      <div class="modal-content${opts.contentClass ? ' ' + opts.contentClass : ''}"></div>
    `;

    if (optType == TYPE_ALERT) {
      inner += `
          <div class="modal-footer">
            <button class="confirm secondary" ui-action="close-modals">OK</button>
          </div>`;
    } else if (optType == TYPE_CONFIRM) {
      inner += `
          <div class="modal-footer">
            <button class="confirm primary" ui-action="close-modals">OK</button>
            <button class="cancel secondary" ui-action="close-modals">Cancel</button>
          </div>`;
    } else if (optType == TYPE_MODAL) {
      inner += `
          <div class="modal-footer">
            <button class="confirm primary" ui-action="close-modals">Dismiss</button>
          </div>`;
    }

    const id: string = 'modal-' + Date.now();
    const html: string =
      `<div id="${id}" class="modal-outer${opts.modalOuterClass ? ' ' + opts.modalOuterClass : ''}" role="dialog">
        <div class="modal${opts.modalClass ? ' '+escapeHtml(opts.modalClass) : ''}" ${opts.modalCssStyle ? 'style="'+escapeHtml(opts.modalCssStyle)+'"' : ''}>
          ${inner}
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
    const modalOuterEl: HTMLElement = document.querySelector(`#${id}`);

    if (contents instanceof Node) {
      modalOuterEl.querySelector(`.modal-content`).append(contents);
    } else {
      modalOuterEl.querySelector(`.modal-content`).innerHTML = contents;
    }

    if (opts.onConfirm) {
      modalOuterEl.querySelectorAll(`.confirm`).forEach(confirmBtn => {
        confirmBtn.addEventListener('click', () => {
          opts.onConfirm(modalOuterEl);
        });
      })
    }

    if (opts.onCancel) {
      modalOuterEl.querySelectorAll(`.cancel`).forEach(cancelBtn => {
        cancelBtn.addEventListener('click', () => {
          opts.onCancel(modalOuterEl);
        });
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
      modalOuterEl.classList.add('in');
      modalOuterEl.querySelector(`.modal`).classList.add('in');

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
    document.querySelectorAll('.modal-outer').forEach(el => {
      el.classList.remove('in');
      el.querySelector('.modal').classList.remove('in');
      setTimeout(() => {
        el.remove();
      }, 300);
    });
    document.body.removeEventListener('keyup', this.active_listener.bind(this));
  }
}

export const modalService = new ModalService();

(<any> window).modalService = modalService;