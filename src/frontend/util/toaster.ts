import { escapeHtml } from '../../shared/util/stringUtil';

export const TOAST_INFO = 'info';
export const TOAST_SUCCESS = 'success';
export const TOAST_ERROR = 'error';

export type ToastOpts = {
  type?: string,
  title?: string,
  content?: string,
  ttl?: number,
  allowHTML?: boolean
}

export function makeToast(opts: ToastOpts) {
  opts = Object.assign({
    type: TOAST_INFO,
    title: '',
    content: '',
    ttl: 4000,
    allowHTML: false,
  }, opts);

  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('DIV');
    toastContainer.id = 'toast-container';
    document.body.append(toastContainer);
  }

  let toast = document.createElement('DIV');
  toast.classList.add('toast', `toast-${opts.type}`);
  toast.innerHTML = `
    <div class="toast-card">
      <div class="toast-inner">
        <div class="toast-content">
          <div class="toast-title">${opts.allowHTML ? opts.title : escapeHtml(opts.title)}</div>
          <div class="toast-desc">${opts.allowHTML ? opts.content : escapeHtml(opts.content)}</div>
        </div>
        <button class="close small"></button>
      </div>
    </div>
    `;

  const transitionTime = 300;
  const transitionVal = `all ${transitionTime}ms ease`

  toast.style.cssText = 'position:absolute;left:-9999px;opacity:0;';
  toastContainer.append(toast);
  toast.style.cssText = `margin-bottom: -${toast.clientHeight}px;opacity:0`;

  function eatToast() {
    const rect = toast.getBoundingClientRect();
    const prevToast: HTMLElement = toast.previousElementSibling as HTMLElement;
    const bottomPos = toastContainer.clientHeight - (rect.top - toastContainer.offsetTop) - toast.clientHeight;

    toast.style.cssText = `bottom:${bottomPos}px;left:${rect.left}px;position:absolute;transition:${transitionVal};`;

    if (prevToast) {
      prevToast.style.removeProperty('transition');
    }

    const removeToastFunc = () => {
      window.requestAnimationFrame(() => {
        toast.style.marginLeft = '80px';
        toast.style.opacity = '0.0';

        setTimeout(() => {
          toast.remove();
          if (prevToast) {
            prevToast.style.transition = transitionVal;
            prevToast.style.marginBottom = '0px';
          }
        }, transitionTime);
      });
    };

    if (prevToast) {
      setTimeout(() => {
        prevToast.style.marginBottom = `${toast.clientHeight}px`;
        setTimeout(removeToastFunc, 5);
      }, 5);
    } else {
      setTimeout(removeToastFunc, 5);
    }
  }

  window.setTimeout(() => {
    toast.style.transition = transitionVal;
    toast.querySelector('button.close').addEventListener('click', () => eatToast());

    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        toast.style.marginBottom = '0px';
        toast.style.opacity = '0.8';
      });
    }, 5);
  }, 5);

  if (opts.ttl) {
    setTimeout(() => eatToast(), opts.ttl);
  }
}

export function toastInfo(opts: ToastOpts) {
  opts.type = TOAST_INFO;
  makeToast(opts);
}

export function toastSuccess(opts: ToastOpts) {
  opts.type = TOAST_SUCCESS;
  makeToast(opts);
}

export function toastError(opts: ToastOpts) {
  opts.type = TOAST_ERROR;
  makeToast(opts);
}