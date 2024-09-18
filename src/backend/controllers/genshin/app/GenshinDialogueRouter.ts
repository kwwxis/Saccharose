import { create } from '../../../routing/router.ts';
import { reminderGenerateAll } from '../../../domain/genshin/dialogue/reminder_generator.ts';
import { GenshinControl, getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { ol_gen_from_id, OLResult } from '../../../domain/abstract/basic/OLgen.ts';
import { Request, Response, Router } from 'express';
import GenshinAllReminders from '../../../components/genshin/reminders/GenshinAllReminders.vue';
import GenshinQuestPage from '../../../components/genshin/quests/GenshinQuestPage.vue';
import {
  ChapterCollection,
  ChapterExcelConfigData,
  ChapterOLView,
} from '../../../../shared/types/genshin/quest-types.ts';
import GenshinChapterPage from '../../../components/genshin/chapters/GenshinChapterPage.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/vo-to-dialogue', async (req: Request, res: Response) => {
    res.render('pages/genshin/dialogue/vo-to-dialogue', {
      title: 'VO to Dialogue',
      bodyClass: ['page--vo-to-dialogue']
    });
  });

  router.get('/chapters', async (req: Request, res: Response) => {
    const chapters: ChapterCollection = await getGenshinControl(req).selectChapterCollection();

    res.render(GenshinChapterPage, {
      title: 'Chapters & Acts',
      chapters: chapters,
      bodyClass: ['page--chapters']
    });
  });

  router.get('/chapters/:id', async (req: Request, res: Response) => {
    const ctrl: GenshinControl = getGenshinControl(req);
    const chapter: ChapterExcelConfigData = await ctrl.selectChapterById(toInt(req.params.id));
    if (!chapter) {
      return res.render(GenshinChapterPage, {
        title: 'Chapters & Acts',
        chapterNotFound: true,
        requestId: req.params.id,
        bodyClass: ['page--chapters']
      });
    }

    const mainChapterNameOL: OLResult = await ol_gen_from_id(ctrl, chapter.ChapterNumTextMapHash);
    const subChapterNameOL: OLResult = await ol_gen_from_id(ctrl, chapter.ChapterImageTitleTextMapHash);
    const actNameOL: OLResult = await ol_gen_from_id(ctrl, chapter.ChapterTitleTextMapHash);

    res.render(GenshinChapterPage, {
      title: chapter.Summary.ActName,
      chapter: chapter,
      chapterOL: <ChapterOLView> {
        mainChapterName: mainChapterNameOL,
        subChapterName: subChapterNameOL,
        actName: actNameOL,
      },
      bodyClass: ['page--chapters']
    });
  });

  router.get('/quests', async (req: Request, res: Response) => {
    res.render(GenshinQuestPage, {
      title: 'Quests',
      bodyClass: ['page--quests']
    });
  });

  router.get('/quests/:id', async (req: Request, res: Response) => {
    let mainQuest = await getGenshinControl(req).selectMainQuestById(toInt(req.params.id));
    res.render(GenshinQuestPage, {
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
    res.render(GenshinAllReminders, {
      title: 'All Reminders',
      reminderGroups: await reminderGenerateAll(getGenshinControl(req)),
      bodyClass: ['page--all-reminders']
    });
  });

  return router;
}
