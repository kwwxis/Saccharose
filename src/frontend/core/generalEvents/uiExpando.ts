import { toInt, toNumber } from '../../../shared/util/numberUtil.ts';
import { uuidv4 } from '../../../shared/util/uuidv4.ts';


export function uiExpando(trigger: HTMLElement, container: HTMLElement) {
  const inTransition = container.classList.contains('collapsing') || container.classList.contains('expanding');
  if (inTransition) {
    return;
  }
  if (container.classList.contains('collapsed')) {
    // Currently collapsed, do expand
    doExpand(trigger, container);
  } else {
    // Currently expanded, do collapse
    doCollapse(trigger, container);
  }
}

function getOriginalValues(container: HTMLElement) {
  let height: number;
  let paddingTop: string = '0px';
  let paddingBottom: string = '0px';

  if (container.hasAttribute('data-original-height')) {
    // Use data-original-height (if it exists)
    height = toNumber(container.getAttribute('data-original-height'));
    container.removeAttribute('data-original-height');
  } else {
    // Otherwise, use scrollHeight, which should be approximately correct.
    height = container.scrollHeight;
  }

  if (container.hasAttribute('data-original-padding-top')) {
    paddingTop = container.getAttribute('data-original-padding-top');
    container.removeAttribute('data-original-padding-top');
  }

  if (container.hasAttribute('data-original-padding-bottom')) {
    paddingBottom = container.getAttribute('data-original-padding-bottom');
    container.removeAttribute('data-original-padding-bottom');
  }

  return { height, paddingBottom, paddingTop };
}

function setOriginalValues(container: HTMLElement) {
  const height: number = container.getBoundingClientRect().height;
  const computedStyles = window.getComputedStyle(container);

  container.setAttribute('data-original-height', String(height));
  container.setAttribute('data-original-padding-top', String(computedStyles.paddingTop));
  container.setAttribute('data-original-padding-bottom', String(computedStyles.paddingBottom));

  return {
    height,
    paddingTop: String(computedStyles.paddingTop),
    paddingBottom: String(computedStyles.paddingBottom),
  }
}

function doExpand(trigger: HTMLElement, container: HTMLElement) {
  const animId = uuidv4();

  trigger.classList.remove('expand-action');
  trigger.classList.add('collapse-action');

  trigger.classList.add('expanded-state');
  trigger.classList.remove('collapsed-state');

  container.classList.remove('hide');

  const { height, paddingBottom, paddingTop } = getOriginalValues(container);
  const duration: number = Math.min(500, Math.max(200, height / 5 | 0));

  const styleEl: HTMLStyleElement = addStyle(`
    .expanding-${animId} {
      overflow: hidden;
      animation: expanding-${animId} ${duration}ms ease forwards;
    }
    @keyframes expanding-${animId} {
      100% {
        height: ${height}px;
        padding-top: ${paddingTop};
        padding-bottom: ${paddingBottom};
      }
    }
  `);

  container.style.height = '0';
  container.style.paddingTop = '0';
  container.style.paddingBottom = '0';
  container.style.overflow = 'hidden';

  setTimeout(() => {
    container.classList.remove('collapsed');
    container.classList.add('expanding', 'expanding-' + animId);
    setTimeout(() => {
      container.style.removeProperty('height');
      container.style.removeProperty('overflow');
      container.style.removeProperty('padding-top');
      container.style.removeProperty('padding-bottom');
      container.classList.add('expanded');
      container.classList.remove('expanding', 'expanding-' + animId);
      styleEl.remove();
    }, duration);
  })
}

function doCollapse(trigger: HTMLElement, container: HTMLElement) {
  const animId = uuidv4();

  trigger.classList.add('expand-action');
  trigger.classList.remove('collapse-action');

  trigger.classList.remove('expanded-state');
  trigger.classList.add('collapsed-state');

  const { height, paddingTop, paddingBottom } = setOriginalValues(container);
  const duration: number = Math.min(500, Math.max(200, height / 5 | 0));

  const styleEl: HTMLStyleElement = addStyle(`
      .collapsing-${animId} {
        overflow: hidden;
        animation: collapsing-${animId} ${duration}ms ease forwards;
      }
      @keyframes collapsing-${animId} {
        100% {
          height: 0;
          padding-top: 0;
          padding-bottom: 0;
        }
      }
  `);

  container.style.height = height + 'px';
  container.style.paddingTop = paddingTop;
  container.style.paddingBottom = paddingBottom;
  container.style.overflow = 'hidden';

  container.classList.remove('expanded');
  container.classList.add('collapsing', 'collapsing-' + animId);
  setTimeout(() => {
    container.style.removeProperty('height');
    container.style.removeProperty('padding-top');
    container.style.removeProperty('padding-bottom');
    container.style.removeProperty('overflow');
    container.classList.add('collapsed');
    container.classList.remove('collapsing', 'collapsing-' + animId);
    styleEl.remove();
    setTimeout(() => {
      container.classList.add('hide');
    });
  }, duration);
}

function addStyle(css: string): HTMLStyleElement {
  const styleEl: HTMLStyleElement = document.createElement('style');
  styleEl.textContent = css;
  document.head.append(styleEl);
  return styleEl;
}
