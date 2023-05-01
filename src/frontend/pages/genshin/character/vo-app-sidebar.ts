import lunr from 'lunr';
import { startListeners } from '../../../util/eventLoader';
import { ltrim, rtrim } from '../../../../shared/util/stringUtil';
import { VoAppState } from './vo-tool';

export function VoAppSidebar(state: VoAppState) {
  const avatarIdx: lunr.Index = lunr(function() {
    this.ref('Id');
    this.field('NameText');
    state.avatars.forEach(doc => {
      this.add(doc);
    });
  });

  startListeners([
    {
      el: '#vo-toolbar-sidebar-search',
      ev: 'input',
      fn: function(event: InputEvent, target: HTMLInputElement) {
        let searchText = target.value.trim();
        if (!searchText) {
          document.querySelectorAll('.vo-toolbar-sidebar-avatar').forEach(el => el.classList.remove('hide'));
          return;
        }

        let query = '';
        query += rtrim(searchText, '*') + '^2 '
        query += rtrim(searchText, '*') + '*' + ' '
        query += ltrim(searchText, '*') + '~1';

        let results: lunr.Index.Result[] = avatarIdx.search(query);

        document.querySelectorAll('.vo-toolbar-sidebar-avatar').forEach(el => el.classList.add('hide'));

        for (let result of results) {
          document.querySelector('#vo-toolbar-sidebar-avatar-' + result.ref).classList.remove('hide');
        }
      }
    },
  ]);
}