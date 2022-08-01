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
      styles: [],
      isResultPage: false,
    });
  });

  router.get('/quests/:id', async (req: Request, res: Response) => {
    let id = toInt(req.params.id);
    let locals: any = {
      isResultPage: true,
    };

    if (isNaN(id)) {
      locals.error = 'ID must be a number';
    } else {
      try {
        let result: QuestGenerateResult = await questGenerate(id);
        locals.questTitle = result.questTitle;
        locals.questId = result.questId;
        locals.npc = result.npc;
        locals.templateWikitext = result.templateWikitext;
        locals.questDescriptionWikitext = result.questDescriptionWikitext;
        locals.otherLanguagesWikitext = result.otherLanguagesWikitext;
      } catch (e) {
        if (typeof e === 'string') {
          locals.error = e;
        } else {
          locals.error = 'An internal error occurred';
        }
      }
    }

    res.render('pages/quests', locals);
  });

  router.get('/OL', async (req: Request, res: Response) => {
    res.render('pages/olgen', {
      styles: []
    });
  });

  return router;
}