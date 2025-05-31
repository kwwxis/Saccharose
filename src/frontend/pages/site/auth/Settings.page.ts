import { pageMatch } from '../../../core/pageMatch.ts';
import { modalService } from '../../../util/modalService.ts';
import { genericEndpoints } from '../../../core/endpoints.ts';

pageMatch('vue/SettingsPage', () => {
  document.querySelector('#auth-uncheck')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();

    modalService.confirm(
      'Confirm you want to deregister the wiki username?',
      'You will be required to re-register to regain access to the site.').onConfirm(() => {
      genericEndpoints.authUncheck.send({}).then(() => {
        window.location.reload();
      })
    });
  });
});
