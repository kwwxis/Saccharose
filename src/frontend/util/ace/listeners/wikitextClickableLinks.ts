import { SITE_MODE_WIKI_DOMAIN } from '../../../siteMode.ts';
import { escapeHtml } from '../../../../shared/util/stringUtil.ts';
import { hasSelection } from '../../domutil.ts';

export function applyWikitextClickableLinks(element: HTMLElement) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  element.querySelectorAll('.ace_template-name, .ace_link-name').forEach((el: HTMLElement) => {
    let linkPrefix = '';
    let tooltipType = '';

    if (el.classList.contains('ace_template-name')) {
      linkPrefix = 'Template:';
      tooltipType = 'template';
    } else {
      tooltipType = 'link';
    }

    const page = el.innerText.replace(/\s/g, '_');
    const url = `https://${SITE_MODE_WIKI_DOMAIN}/wiki/${linkPrefix}${page}`;
    el.setAttribute('data-href', url);

    const tooltipEl = document.createElement('span');
    tooltipEl.classList.add('ace_token-tooltip');
    tooltipEl.setAttribute('data-type', tooltipType);
    tooltipEl.innerHTML = `<span>${isMac ? 'Meta' : 'Ctrl'}-click to open in new tab (alt-click to focus)</span><br />` +
      `<a>${escapeHtml(url)}</a>`;

    el.addEventListener('mouseenter', () => {
      if (hasSelection()) {
        return;
      }
      const elRect = el.getBoundingClientRect();
      const tooltipTop = elRect.top + document.body.scrollTop + elRect.height + 5;
      const tooltipLeft = elRect.left + (elRect.width / 2);
      tooltipEl.style.top = tooltipTop + 'px';
      tooltipEl.style.left = tooltipLeft + 'px';
      document.body.append(tooltipEl);
      setTimeout(() => tooltipEl.classList.add('active'));
    });
    el.addEventListener('mouseleave', () => {
      tooltipEl.classList.remove('active');
      tooltipEl.remove();
    });
  });
}
