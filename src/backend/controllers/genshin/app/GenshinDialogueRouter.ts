import { create } from '../../../routing/router';
import { reminderGenerateAll } from '../../../domain/genshin/dialogue/reminder_generator';
import { getGenshinControl } from '../../../domain/genshin/genshinControl';
import { toInt } from '../../../../shared/util/numberUtil';
import { ol_gen_from_id } from '../../../domain/generic/basic/OLgen';
import { orderChapterQuests } from '../../../domain/genshin/dialogue/dialogue_util';
import { Request, Response, Router } from 'express';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/vo-to-dialogue', async (req: Request, res: Response) => {
    res.render('pages/genshin/dialogue/vo-to-dialogue', {
      title: 'VO to Dialogue',
      bodyClass: ['page--vo-to-dialogue']
    });
  });

  router.get('/chapters', async (req: Request, res: Response) => {
    const chapters = await getGenshinControl(req).selectChapterCollection();

    res.render('pages/genshin/dialogue/chapters', {
      title: 'Chapters & Acts',
      chapters: chapters,
      bodyClass: ['page--chapters']
    });
  });

  router.get('/chapters/:id', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const chapter = await ctrl.selectChapterById(toInt(req.params.id));
    if (!chapter) {
      return res.render('pages/genshin/dialogue/chapters', {
        title: 'Chapters & Acts',
        chapterNotFound: true,
        requestId: req.params.id,
        bodyClass: ['page--chapters']
      });
    }

    const quests = await orderChapterQuests(ctrl, chapter);

    const mainChapterNameOL = await ol_gen_from_id(ctrl, chapter.ChapterNumTextMapHash);
    const subChapterNameOL = await ol_gen_from_id(ctrl, chapter.ChapterImageTitleTextMapHash);
    const actNameOL = await ol_gen_from_id(ctrl, chapter.ChapterTitleTextMapHash);

    res.render('pages/genshin/dialogue/chapters', {
      title: chapter.Summary.ActName,
      chapter: chapter,
      quests: quests,
      OL: {
        mainChapterName: mainChapterNameOL,
        subChapterName: subChapterNameOL,
        actName: actNameOL,
      },
      bodyClass: ['page--chapters']
    });
  });

  router.get('/quests', async (req: Request, res: Response) => {
    res.render('pages/genshin/dialogue/quests', {
      title: 'Quests',
      bodyClass: ['page--quests']
    });
  });

  router.get('/quests/:id', async (req: Request, res: Response) => {
    let mainQuest = await getGenshinControl(req).selectMainQuestById(toInt(req.params.id));
    res.render('pages/genshin/dialogue/quests', {
      title: mainQuest ? mainQuest.TitleText + ' - Quests' : 'Quest Not Found',
      bodyClass: ['page--quests']
    });
  });

  router.get('/branch-dialogue', async (req: Request, res: Response) => {
    res.render('pages/genshin/dialogue/branch-dialogue', {
      title: 'Single Branch Dialogue',
      bodyClass: ['page--branch-dialogue']
    });
  });

  router.get('/npc-dialogue', async (req: Request, res: Response) => {
    res.render('pages/genshin/dialogue/npc-dialogue', {
      title: 'NPC Dialogue',
      bodyClass: ['page--npc-dialogue']
    });
  });

  router.get('/reminders', async (req: Request, res: Response) => {
    res.render('pages/genshin/dialogue/reminders', {
      title: 'Reminders',
      bodyClass: ['page--reminders']
    });
  });

  router.get('/reminders/all', async (req: Request, res: Response) => {
    res.render('pages/genshin/dialogue/reminders-all', {
      title: 'All Reminders',
      dialogue: await reminderGenerateAll(getGenshinControl(req)),
      bodyClass: ['page--all-reminders']
    });
  });

  return router;
}