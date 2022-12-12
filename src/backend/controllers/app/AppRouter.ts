import { fetchCharacterStories, fetchCharacterStoryByAvatarId, fetchCharacterStoryByAvatarName } from '../../scripts/fetters/fetchStoryFetters';
import { fetchCompanionDialogue, getHomeWorldCompanions } from '../../scripts/homeworld/companion_dialogue';
import { reminderGenerateAll } from '../../scripts/dialogue/reminder_generator';
import { getControl } from '../../scripts/script_util';
import { create, Router, Request, Response } from '../../util/router';

import LandingController from './LandingController';
import { isInt, toInt } from '../../../shared/util/numberUtil';
import { HomeWorldNPCExcelConfigData } from '../../../shared/types/homeworld-types';
import { StoryFetters } from '../../../shared/types/fetter-types';
import { orderChapterQuests } from '../../scripts/misc/orderChapterQuests';
import { ol_gen_from_id } from '../../scripts/OLgen/OLgen';
import { sort } from '../../../shared/util/arrayUtil';

export default async function(): Promise<Router> {
  const router: Router = create({
    layouts: ['layouts/app-layout'],
    bodyClass: ['in-app'],
  });

  router.use('/', await LandingController());

  router.get('/text-map-expand', async (req: Request, res: Response) => {
    res.render('pages/basic/text-map-expand', {
      bodyClass: ['page--text-map-expand']
    });
  });

  router.get('/vo-to-dialogue', async (req: Request, res: Response) => {
    res.render('pages/dialogue/vo-to-dialogue', {
      bodyClass: ['page--vo-to-dialogue']
    });
  });

  router.get('/chapters', async (req: Request, res: Response) => {
    const chapters = await getControl(req).selectChapterCollection();

    res.render('pages/dialogue/chapters', {
      chapters: chapters,
      bodyClass: ['page--chapters']
    });
  });

  router.get('/chapters/:id', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const chapter = await ctrl.selectChapterById(toInt(req.params.id));
    if (!chapter) {
      return res.render('pages/dialogue/chapters', {
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
      bodyClass: ['page--quests']
    });
  });

  router.get('/quests/:id', async (req: Request, res: Response) => {
    res.render('pages/dialogue/quests', {
      bodyClass: ['page--quests']
    });
  });

  router.get('/branch-dialogue', async (req: Request, res: Response) => {
    res.render('pages/dialogue/branch-dialogue', {
      bodyClass: ['page--branch-dialogue']
    });
  });

  router.get('/OL', async (req: Request, res: Response) => {
    res.render('pages/basic/olgen', {
      bodyClass: ['page--OL']
    });
  });

  router.get('/npc-dialogue', async (req: Request, res: Response) => {
    res.render('pages/dialogue/npc-dialogue', {
      bodyClass: ['page--npc-dialogue']
    });
  });

  router.get('/reminders', async (req: Request, res: Response) => {
    res.render('pages/dialogue/reminders', {
      bodyClass: ['page--reminders']
    });
  });

  router.get('/reminders/all', async (req: Request, res: Response) => {
    res.render('pages/dialogue/reminders-all', {
      dialogue: await reminderGenerateAll(getControl(req)),
      bodyClass: ['page--all-reminders']
    });
  });

  router.get('/character/companion-dialogue', async (req: Request, res: Response) => {
    let companions: HomeWorldNPCExcelConfigData[] = await getHomeWorldCompanions(getControl(req));
    let characters = companions.map(c =>
      c.Avatar
        ? { name: c.Avatar.NameText, icon: c.Avatar.IconName }
        : { name: c.Npc.NameText }
    );
    sort(characters, 'name');
    res.render('pages/character/companion-dialogue', {
      characters: characters,
      bodyClass: ['page--companion-dialogue']
    });
  });

  router.get('/character/companion-dialogue/:charName', async (req: Request, res: Response) => {
    let charName = <string> req.params.charName;
    charName = charName.replace(/_/g, ' ');

    res.render('pages/character/companion-dialogue', {
      charName: charName,
      dialogue: await fetchCompanionDialogue(getControl(req), charName),
      bodyClass: ['page--companion-dialogue']
    });
  });

  router.get('/character/stories', async (req: Request, res: Response) => {
    let storiesByAvatar = await fetchCharacterStories(getControl(req));
    let avatars = Object.values(storiesByAvatar).map(x => x.avatar).sort((a,b) => a.NameText.localeCompare(b.NameText));
    res.render('pages/character/character-stories', {
      avatars: avatars,
      bodyClass: ['page--character-stories']
    });
  });

  router.get('/character/stories/:avatarId', async (req: Request, res: Response) => {
    let story: StoryFetters;
    if (isInt(req.params.avatarId)) {
      story = await fetchCharacterStoryByAvatarId(getControl(req), toInt(req.params.avatarId));
    } else {
      story = await fetchCharacterStoryByAvatarName(getControl(req), req.params.avatarId);
    }

    let validTabs = new Set(['wikitext', 'display', 'altered-wikitext', 'altered-display']);
    if (typeof req.query.tab === 'string') {
      if (!validTabs.has(req.query.tab)) {
        req.query.tab = 'display';
      }
      if (!story.hasAlteredStories && req.query.tab.startsWith('altered-')) {
        req.query.tab = req.query.tab.slice('altered-'.length);
      }
    }

    res.render('pages/character/character-stories', {
      avatarId: req.params.avatarId,
      story: story,
      bodyClass: ['page--character-stories'],
      tab: req.query.tab || 'display',
    });
  });
  router.get('/character/VO', async (req: Request, res: Response) => {
    let storiesByAvatar = await fetchCharacterStories(getControl(req));
    let avatars = Object.values(storiesByAvatar).map(x => x.avatar).sort((a,b) => a.NameText.localeCompare(b.NameText));

    res.render('pages/character/vo-tool', {
      bodyClass: ['page--vo-tool'],
      avatars
    });
  });

  // These are for testing purposes - making sure the global error handlers work
  router.get('/trigger-exception1', async (_req: Request, _res: Response) => {
    let thing = {};
    thing['foobar']();
  });
  router.get('/trigger-exception2', async (_req: Request, res: Response) => {
    res.render('pages/character/character-stories');
  });

  return router;
}