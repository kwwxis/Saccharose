import { questGenerate, QuestGenerateResult } from '@/scripts/dialogue/quest_generator';
import { toInt } from '@functions';
import { create, Router, Request, Response } from '@router';

import LandingController from './LandingController';

export default async function(): Promise<Router> {
  const router: Router = create({
    layouts: ['layouts/app-layout'],
    bodyClass: ['in-app'],
    styles: [],
  });

  router.use('/', await LandingController());

  router.get('/quests', async (req: Request, res: Response) => {
    res.render('pages/quests', {
      styles: ['app.dialogue'],
      bodyClass: ['page--quests'],
      tab: 'dialogue',
    });
  });

  router.get('/quests/:id', async (req: Request, res: Response) => {
    res.render('pages/quests', {
      styles: ['app.dialogue'],
      bodyClass: ['page--quests'],
      tab: 'dialogue',
    });
  });

  router.get('/OL', async (req: Request, res: Response) => {
    res.render('pages/olgen', {
      styles: [],
      bodyClass: ['page--OL'],
    });
  });

  return router;
}