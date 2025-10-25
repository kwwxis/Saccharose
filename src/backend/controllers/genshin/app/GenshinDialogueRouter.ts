import { create } from '../../../routing/router.ts';
import {
  reminderGenerateAll,
  reminderGenerateFromSpeakerTextMapHashes,
} from '../../../domain/genshin/dialogue/reminder_generator.ts';
import { GenshinControl, getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { ol_gen_from_id } from '../../../domain/abstract/basic/OLgen.ts';
import { Request, Response, Router } from 'express';
import GenshinAllReminders from '../../../components/genshin/reminders/GenshinAllReminders.vue';
import GenshinQuestPage from '../../../components/genshin/quests/GenshinQuestPage.vue';
import {
  ChapterCollection,
  ChapterExcelConfigData,
  ChapterOLView,
} from '../../../../shared/types/genshin/quest-types.ts';
import GenshinChapterPage from '../../../components/genshin/chapters/GenshinChapterPage.vue';
import GenshinBranchDialoguePage from '../../../components/genshin/dialogue/GenshinBranchDialoguePage.vue';
import GenshinNpcDialoguePage from '../../../components/genshin/dialogue/GenshinNpcDialoguePage.vue';
import GenshinRemindersPage from '../../../components/genshin/dialogue/GenshinRemindersPage.vue';
import GenshinVoToDialoguePage from '../../../components/genshin/dialogue/GenshinVoToDialoguePage.vue';
import { OLResult } from '../../../../shared/types/ol-types.ts';
import { AvatarExcelConfigData } from '../../../../shared/types/genshin/avatar-types.ts';
import { getGenshinAvatar, getGenshinAvatars } from '../../../middleware/game/genshinAvatarUtil.ts';
import {
  dialogueGenerateForTalkExcelByAvatarIdForBeginConds, TalkExcelAvatarBeginCondResult,
} from '../../../domain/genshin/dialogue/basic_dialogue_generator.ts';
import GenshinAvatarCondDialoguePage from '../../../components/genshin/dialogue/GenshinAvatarCondDialoguePage.vue';
import { inDialogueReadablesHelper, questStillsHelper } from '../api/DialogueResources.ts';
import { TextMapHash } from '../../../../shared/types/lang-types.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/vo-to-dialogue', async (req: Request, res: Response) => {
    await res.renderComponent(GenshinVoToDialoguePage, {
      title: 'VO to Dialogue',
      bodyClass: ['page--vo-to-dialogue']
    });
  });

  router.get('/chapters', async (req: Request, res: Response) => {
    const chapters: ChapterCollection = await getGenshinControl(req).selectChapterCollection();

    await res.renderComponent(GenshinChapterPage, {
      title: 'Chapters & Acts',
      chapters: chapters,
      bodyClass: ['page--chapters']
    });
  });

  router.get('/chapters/:id', async (req: Request, res: Response) => {
    const ctrl: GenshinControl = getGenshinControl(req);
    const chapter: ChapterExcelConfigData = await ctrl.selectChapterById(toInt(req.params.id));
    if (!chapter) {
      await res.renderComponent(GenshinChapterPage, {
        title: 'Chapters & Acts',
        chapterNotFound: true,
        requestId: req.params.id,
        bodyClass: ['page--chapters']
      });
      return;
    }

    const mainChapterNameOL: OLResult = await ol_gen_from_id(ctrl, chapter.ChapterNumTextMapHash);
    const subChapterNameOL: OLResult = await ol_gen_from_id(ctrl, chapter.ChapterImageTitleTextMapHash);
    const actNameOL: OLResult = await ol_gen_from_id(ctrl, chapter.ChapterTitleTextMapHash);

    await res.renderComponent(GenshinChapterPage, {
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
    await res.renderComponent(GenshinQuestPage, {
      title: 'Quests',
      bodyClass: ['page--quests']
    });
  });

  router.get('/quests/:id', async (req: Request, res: Response) => {
    let mainQuest = await getGenshinControl(req).selectMainQuestById(toInt(req.params.id));
    await res.renderComponent(GenshinQuestPage, {
      title: mainQuest ? mainQuest.TitleText + ' - Quests' : 'Quest Not Found',
      bodyClass: ['page--quests']
    });
  });

  router.get('/branch-dialogue', async (req: Request, res: Response) => {
    await res.renderComponent(GenshinBranchDialoguePage, {
      title: 'Single Branch Dialogue',
      bodyClass: ['page--branch-dialogue']
    });
  });

  router.get('/npc-dialogue', async (req: Request, res: Response) => {
    await res.renderComponent(GenshinNpcDialoguePage, {
      title: 'NPC Dialogue',
      bodyClass: ['page--npc-dialogue']
    });
  });

  router.get('/reminders', async (req: Request, res: Response) => {
    await res.renderComponent(GenshinRemindersPage, {
      title: 'Reminders',
      bodyClass: ['page--reminders']
    });
  });

  router.get('/reminders/all', async (req: Request, res: Response) => {
    await res.renderComponent(GenshinAllReminders, {
      title: 'All Reminders',
      reminderGroups: await reminderGenerateAll(getGenshinControl(req)),
      bodyClass: ['page--all-reminders']
    });
  });

  router.get('/avatar-cond-dialogue', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const avatarIds = await ctrl.selectAvatarIdsForTalkExcelAvatarBeginConds();
    const avatars: AvatarExcelConfigData[] = await getGenshinAvatars(getGenshinControl(req), true, avatarIds);

    await res.renderComponent(GenshinAvatarCondDialoguePage, {
      title: 'Avatar Condition Dialogue',
      bodyClass: ['page--avatar-cond-dialogue'],
      avatars,
    });
  });

  router.get('/avatar-cond-dialogue/:avatar', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const avatar: AvatarExcelConfigData = await getGenshinAvatar(ctrl, req, true);
    const result: TalkExcelAvatarBeginCondResult = await dialogueGenerateForTalkExcelByAvatarIdForBeginConds(ctrl, avatar);

    await res.renderComponent(GenshinAvatarCondDialoguePage, {
      title: 'Avatar Condition Dialogue',
      bodyClass: ['page--avatar-cond-dialogue'],
      avatar,
      result,
      ... await questStillsHelper(ctrl),
      ... await inDialogueReadablesHelper(ctrl),
    });
  });

  // router.get('/nefer-skill-dialogue', async (req: Request, res: Response) => {
  //   const englishControl = getGenshinControl();
  //   const neferNameHashes: TextMapHash[] = await englishControl.findTextMapHashesByExactName('Nefer');
  //
  //   const ctrl = getGenshinControl(req);
  //   const reminders = await reminderGenerateFromSpeakerTextMapHashes(ctrl, neferNameHashes);
  //
  //
  //
  //   await res.renderComponent(GenshinAvatarCondDialoguePage, {
  //     title: 'Avatar Condition Dialogue',
  //     bodyClass: ['page--avatar-cond-dialogue'],
  //     avatars,
  //   });
  // });

  return router;
}
