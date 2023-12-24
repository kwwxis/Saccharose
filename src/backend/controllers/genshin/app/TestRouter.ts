import { Request, Response, Router } from 'express';
import { create } from '../../../routing/router.ts';
import VuePageTest from '../../../components/VuePageTest.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/vue-test', async (req: Request, res: Response) => {
    console.log('foobar');
    res.render(VuePageTest, {
      msg: 'hello world!',
      title: 'Vue Test'
    });
  });

  return router;
}
