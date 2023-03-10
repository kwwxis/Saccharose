import { create, Request, Response, Router } from '../../util/router';
import { getControl } from '../../scripts/script_util';
import { getGCGControl } from '../../scripts/gcg/gcg_control';
import { generateGCGTutorialDialogue } from '../../scripts/gcg/gcg_tutorial_text';
import { GCGGameExcelConfigData } from '../../../shared/types/gcg-types';
import { defaultMap } from '../../../shared/util/genericUtil';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/TCG/talk-detail', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    res.render('pages/gcg/gcg-talk-detail', {
      title: 'TCG Talk Detail',
      talkSections: await getGCGControl(ctrl).generateGCGTalkDialogueSections(),
      bodyClass: ['page--tcg-talk-detail']
    });
  });

  router.get('/TCG/tutorial-text', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    res.render('pages/gcg/gcg-tutorial-text', {
      title: 'TCG Tutorial Text',
      dialogue: await generateGCGTutorialDialogue(ctrl),
      bodyClass: ['page--tcg-tutorial-text']
    });
  });

  // TODO: rules page

  router.get('/TCG/stages', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const gcg = getGCGControl(ctrl);

    const stages = await gcg.selectAllStage();
    const stagesByType: {[type: string]: GCGGameExcelConfigData[]} = defaultMap('Array');

    for (let stage of stages) {
      stagesByType[stage.LevelType].push(stage);
    }

    res.render('pages/gcg/stage-list', {
      title: 'TCG Stages',
      stagesByType: stagesByType,
      bodyClass: ['page--tcg-stage']
    });
  });

  router.get('/TCG/stages/:stageId', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const gcg = getGCGControl(ctrl);
    const stage = await gcg.selectStage(req.params.stageId);

    res.render('pages/gcg/gcg-stage', {
      title: stage.LevelPageTitle + ' | TCG Stage',
      stage: stage,
      bodyClass: ['page--tcg-stage']
    });
  });


  router.get('/TCG/cards', async (req: Request, res: Response) => {

  });


  router.get('/TCG/cards/:cardId', async (req: Request, res: Response) => {

  });

  return router;
}