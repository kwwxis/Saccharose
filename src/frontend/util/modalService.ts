import { escapeHtml } from '../../shared/util/stringUtil.ts';
import { getFocusableSelector, isElement } from './domutil.ts';
import { runWhenDOMContentLoaded } from './eventLoader.ts';

const TYPE_ALERT = 0;
const TYPE_MODAL = 1;
const TYPE_CONFIRM = 4;

export type ModalCloseListener = (ref: ModalRef) => void;

const MODAL_REFS: {[id: string]: ModalRef} = {};

export class ModalRef {
  readonly id: string;
  readonly outerEl: HTMLElement;
  private closeListeners: ModalCloseListener[] = [];

  constructor(id: string, outerEl: HTMLElement) {
    this.id = id;
    this.outerEl = outerEl;
  }

  close(): void {
    for (let closeListener of this.closeListeners) {
      closeListener(this);
    }
    this.outerEl.classList.remove('in');
    this.outerEl.querySelector('.modal').classList.remove('in');
    setTimeout(() => {
      this.outerEl.remove();
    })
  }

  /**
   * The close listener is always called when the modal is closed, regardless if the user confirmed or cancelled.
   * @param listener
   */
  onClose(listener: ModalCloseListener): this {
    this.closeListeners.push(listener);
    return this;
  }

  /**
   * Called if the user clicks a confirm button in the modal.
   * @param listener
   */
  onConfirm(listener: ModalCloseListener): this {
    this.outerEl.querySelectorAll(`.confirm`).forEach(confirmBtn => {
      confirmBtn.addEventListener('click', () => {
        listener(this);
      });
    });
    return this;
  }

  /**
   * Called if the user clicks a cancel button in the modal or clicks the "X" button in the modal header.
   * @param listener
   */
  onCancel(listener: ModalCloseListener): this {
    this.outerEl.querySelectorAll(`.cancel`).forEach(cancelBtn => {
      cancelBtn.addEventListener('click', () => {
        listener(this);
      });
    });
    return this;
  }
}

export type ModalOpts = {
  modalOuterClass?: string,
  modalClass?: string,
  modalCssStyle?: string,
  contentClass?: string,

  confirmButtonText?: string,
  cancelButtonText?: string,

  confirmButtonClass?: string,
  cancelButtonClass?: string,
}

class ModalService {

  modal(header: string, contents: string|HTMLElement, opts: ModalOpts = {}): ModalRef {
    return this.open(header, contents, TYPE_MODAL, opts);
  }

  alert(header: string, contents: string|HTMLElement, opts: ModalOpts = {}): ModalRef {
    return this.open(header, contents, TYPE_ALERT, opts);
  }

  confirm(header: string, contents: string|HTMLElement, opts: ModalOpts = {}): ModalRef {
    return this.open(header, contents, TYPE_CONFIRM, opts);
  }

  open(header: string, contents: string|HTMLElement, optType: number, opts: ModalOpts = {}): ModalRef {
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
            <button class="confirm ${opts.confirmButtonClass || 'secondary'}" ui-action="close-modals">${opts.confirmButtonText || 'OK'}</button>
          </div>`;
    } else if (optType == TYPE_CONFIRM) {
      inner += `
          <div class="modal-footer">
            <button class="confirm ${opts.confirmButtonClass || 'primary'}" ui-action="close-modals">${opts.confirmButtonText || 'OK'}</button>
            <button class="cancel ${opts.cancelButtonClass || 'secondary'}" ui-action="close-modals">${opts.cancelButtonText || 'Cancel'}</button>
          </div>`;
    } else if (optType == TYPE_MODAL) {
      inner += `
          <div class="modal-footer">
            <button class="confirm ${opts.confirmButtonClass || 'primary'}" ui-action="close-modals">${opts.confirmButtonText || 'Dismiss'}</button>
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
    const modalRef: ModalRef = new ModalRef(id, modalOuterEl);

    MODAL_REFS[id] = modalRef;

    modalOuterEl.addEventListener('click', (event) => {
      if (isElement(event.target) && !event.target.closest('.modal')) {
        modalRef.close();
      }
    })

    if (contents instanceof Node) {
      modalOuterEl.querySelector(`.modal-content`).append(contents);
    } else {
      modalOuterEl.querySelector(`.modal-content`).innerHTML = contents;
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

    return modalRef;
  }

  closeAll() {
    let keys: string[] = Object.keys(MODAL_REFS);
    for (let key of keys) {
      let modalRef: ModalRef = MODAL_REFS[key];
      if (modalRef) {
        modalRef.close();
        delete MODAL_REFS[key];
      }
    }
  }
}

export const modalService: ModalService = new ModalService();

(<any> window).modalService = modalService;


runWhenDOMContentLoaded(() => {
  document.body.addEventListener('keyup', (e: KeyboardEvent) => {
    if (!Object.keys(MODAL_REFS).length) {
      return;
    }
    const tag = (<HTMLElement> e.target).tagName.toUpperCase();

    const key = e.which || e.keyCode || 0;
    //if (key === 13 && tag != 'TEXTAREA' && tag != 'INPUT' && tag != 'SELECT' && tag != 'BUTTON') modalService.closeAll(); // Enter
    if (key === 27 && tag != 'TEXTAREA' && tag != 'INPUT' && tag != 'SELECT') modalService.closeAll(); // Escape
  })
});
