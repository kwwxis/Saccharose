import { Router } from 'express';
import { create } from '../../../routing/router.ts';
import SiteLogViewPage from '../../../components/site/logview/SiteLogViewPage.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/logview', (req, res) => {
    if (req.user.wiki_username !== 'Kwwxis') {
      res.end();
    }
    res.render(SiteLogViewPage, {
      title: 'Logview',
      bodyClass: ['page--logview', 'page--wide'],
    });
  });

  return router;
}
