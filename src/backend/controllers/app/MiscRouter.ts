import { create, Request, Response, Router } from '../../util/router';
import { selectViewpoints, ViewpointsByRegion } from '../../scripts/misc/viewpoints';
import { getControl } from '../../scripts/script_util';
import { selectTutorials, TutorialsByType } from '../../scripts/misc/tutorials';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/viewpoints', async (req: Request, res: Response) => {
    let viewpointsList: ViewpointsByRegion = await selectViewpoints(getControl(req));
    delete viewpointsList['then'];
    res.render('pages/misc/viewpoints', {
      title: 'Viewpoints',
      bodyClass: ['page--viewpoints'],
      viewpointsList
    });
  })

  router.get('/tutorials', async (req: Request, res: Response) => {
    let tutorialsList: TutorialsByType = await selectTutorials(getControl(req));
    delete tutorialsList['then'];
    res.render('pages/misc/tutorials', {
      title: 'Tutorials',
      bodyClass: ['page--tutorials'],
      tutorialsList
    });
  });

  return router;
}