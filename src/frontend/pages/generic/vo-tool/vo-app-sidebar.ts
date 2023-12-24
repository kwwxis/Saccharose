import { startListeners } from '../../../util/eventLoader.ts';
import { VoAppState } from './vo-tool.ts';

export function VoAppSidebar(_state: VoAppState) {
  const allRows: HTMLElement[] = Array.from(document.querySelectorAll('.vo-toolbar-sidebar-avatar'));
  const pendingIconEl = document.getElementById('vo-toolbar-sidebar-search-pending');

  const lc = (s: string) => s ? s.toLowerCase() : '';
  let debounceId: any;

  startListeners([
    {
      el: '#vo-toolbar-sidebar-search',
      ev: 'input',
      fn: function(_event: InputEvent, target: HTMLInputElement) {
        clearTimeout(debounceId);
        pendingIconEl.classList.remove('hide');

        debounceId = setTimeout(() => {
          let searchText = target.value.trim().toLowerCase();

          if (!searchText) {
            setTimeout(() => {
              allRows.forEach(el => el.classList.remove('search-hide'));
              pendingIconEl.classList.add('hide');
            });
            return;
          }

          for (let row of allRows) {
            let name = lc(row.getAttribute('data-name'));
            if (name.includes(searchText)) {
              row.classList.remove('search-hide');
            } else {
              row.classList.add('search-hide');
            }
          }

          pendingIconEl.classList.add('hide');
        }, 150);
      }
    },
  ]);
}
