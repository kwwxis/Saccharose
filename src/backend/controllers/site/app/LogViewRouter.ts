import { Router } from 'express';
import { create } from '../../../routing/router.ts';
import SiteLogViewPage from '../../../components/site/logview/SiteLogViewPage.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/logview', (req, res) => {
    res.render(SiteLogViewPage, {
      title: 'Logview',
      bodyClass: ['page--logview', 'page--larger'],
    });
  });

  return router;
}
