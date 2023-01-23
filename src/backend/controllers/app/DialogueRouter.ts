import { create, Request, Response, Router } from '../../util/router';
import { reminderGenerateAll } from '../../scripts/dialogue/reminder_generator';
import { getControl } from '../../scripts/script_util';
import { toInt } from '../../../shared/util/numberUtil';
import { orderChapterQuests } from '../../scripts/misc/orderChapterQuests';
import { ol_gen_from_id } from '../../scripts/OLgen/OLgen';

export default async function(): Promise<Router> {
  const router: Router = create();


  router.get('/vo-to-dialogue', async (req: Request, res: Response) => {
    res.render('pages/dialogue/vo-to-dialogue', {
      title: 'VO to Dialogue',
      bodyClass: ['page--vo-to-dialogue']
    });
  });

  router.get('/chapters', async (req: Request, res: Response) => {
    const chapters = await getControl(req).selectChapterCollection();

    res.render('pages/dialogue/chapters', {
      title: 'Chapters & Acts',
      chapters: chapters,
      bodyClass: ['page--chapters']
    });
  });

  router.get('/chapters/:id', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const chapter = await ctrl.selectChapterById(toInt(req.params.id));
    if (!chapter) {
      return res.render('pages/dialogue/chapters', {
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

    res.render('pages/dialogue/chapters', {
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
    res.render('pages/dialogue/quests', {
      title: 'Quests',
      bodyClass: ['page--quests']
    });
  });

  router.get('/quests/:id', async (req: Request, res: Response) => {
    let mainQuest = await getControl(req).selectMainQuestById(req.params.id);
    res.render('pages/dialogue/quests', {
      title: mainQuest ? mainQuest.TitleText + ' - Quests' : 'Quest Not Found',
      bodyClass: ['page--quests']
    });
  });

  router.get('/branch-dialogue', async (req: Request, res: Response) => {
    res.render('pages/dialogue/branch-dialogue', {
      title: 'Single Branch Dialogue',
      bodyClass: ['page--branch-dialogue']
    });
  });

  router.get('/npc-dialogue', async (req: Request, res: Response) => {
    res.render('pages/dialogue/npc-dialogue', {
      title: 'NPC Dialogue',
      bodyClass: ['page--npc-dialogue']
    });
  });

  router.get('/reminders', async (req: Request, res: Response) => {
    res.render('pages/dialogue/reminders', {
      title: 'Reminders',
      bodyClass: ['page--reminders']
    });
  });

  router.get('/reminders/all', async (req: Request, res: Response) => {
    res.render('pages/dialogue/reminders-all', {
      title: 'All Reminders',
      dialogue: await reminderGenerateAll(getControl(req)),
      bodyClass: ['page--all-reminders']
    });
  });

  return router;
}