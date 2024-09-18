import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import ZenlessDialogueHelperPage from '../../../components/zenless/ZenlessDialogueHelperPage.vue';
import ZenlessLandingPage from '../../../components/zenless/ZenlessLandingPage.vue';
import TextmapSearchPage from '../../../components/shared/TextmapSearchPage.vue';
import OLGenPage from '../../../components/shared/OLGenPage.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/', async (req: Request, res: Response) => {
    res.render(ZenlessLandingPage);
  });

  router.get('/textmap', async (req: Request, res: Response) => {
    res.render(TextmapSearchPage, {
      title: 'TextMap Search',
      bodyClass: ['page--textmap']
    });
  });

  router.get('/OL', async (req: Request, res: Response) => {
    res.render(OLGenPage, {
      title: 'OL',
      bodyClass: ['page--OL'],
      hideTlOption: true
    });
  });

  router.get('/dialogue-helper', async (req: Request, res: Response) => {
    res.render(ZenlessDialogueHelperPage, {
      title: 'Dialogue Helper',
      bodyClass: ['page--dialogue-helper']
    });
  });

  return router;
}
