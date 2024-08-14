import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import ZenlessDialogueHelperPage from '../../../components/zenless/ZenlessDialogueHelperPage.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/', async (req: Request, res: Response) => {
    res.render('pages/zenless/landing');
  });

  router.get('/textmap', async (req: Request, res: Response) => {
    res.render('pages/generic/basic/textmap', {
      title: 'TextMap Search',
      bodyClass: ['page--textmap']
    });
  });

  router.get('/OL', async (req: Request, res: Response) => {
    res.render('pages/generic/basic/olgen', {
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

  // router.get('/excel-usages', async (req: Request, res: Response) => {
  //   res.render('pages/generic/basic/excel-usages', {
  //     title: 'Excel usages',
  //     bodyClass: ['page--excel-usages']
  //   });
  // });

  return router;
}
