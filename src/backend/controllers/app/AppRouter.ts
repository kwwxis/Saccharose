import { AvatarAndFetterStoryExcelConfigData, fetchCharacterStories, fetchCharacterStoryByAvatarId, fetchCharacterStoryByAvatarName } from '../../scripts/dialogue/character_story';
import { fetchCompanionDialogue, getHomeWorldCompanions } from '../../scripts/dialogue/companion_dialogue';
import { reminderGenerateAll } from '../../scripts/dialogue/reminder_generator';
import { getControl } from '../../scripts/script_util';
import { create, Router, Request, Response } from '../../util/router';

import LandingController from './LandingController';
import { isInt, toInt } from '../../../shared/util/numberUtil';
import { HomeWorldNPCExcelConfigData } from '../../../shared/types';

export default async function(): Promise<Router> {
  const router: Router = create({
    layouts: ['layouts/app-layout'],
    bodyClass: ['in-app'],
  });

  router.use('/', await LandingController());

  router.get('/quests', async (req: Request, res: Response) => {
    res.render('pages/quests', {
      bodyClass: ['page--quests'],
      tab: 'dialogue',
    });
  });

  router.get('/quests/:id', async (req: Request, res: Response) => {
    res.render('pages/quests', {
      bodyClass: ['page--quests'],
      tab: 'dialogue',
    });
  });

  router.get('/branch-dialogue', async (req: Request, res: Response) => {
    res.render('pages/branch-dialogue', {
      bodyClass: ['page--branch-dialogue'],
    });
  });

  router.get('/OL', async (req: Request, res: Response) => {
    res.render('pages/olgen', {
      bodyClass: ['page--OL'],
    });
  });

  router.get('/npc-dialogue', async (req: Request, res: Response) => {
    res.render('pages/npc-dialogue', {
      bodyClass: ['page--npc-dialogue'],
    });
  });

  router.get('/reminders', async (req: Request, res: Response) => {
    res.render('pages/reminders', {
      bodyClass: ['page--reminders'],
    });
  });

  router.get('/lists/all-reminders', async (req: Request, res: Response) => {
    res.render('pages/lists/reminder-dialogue', {
      dialogue: await reminderGenerateAll(getControl(req)),
      bodyClass: ['page--all-reminders'],
    });
  });

  router.get('/lists/companion-dialogue', async (req: Request, res: Response) => {
    let companions: HomeWorldNPCExcelConfigData[] = await getHomeWorldCompanions(getControl(req));
    let companionNames = companions.map(c => c.Avatar ? c.Avatar.NameText : c.Npc.NameText);
    res.render('pages/lists/companion-dialogue', {
      charNames: companionNames,
      bodyClass: ['page--companion-dialogue'],
    });
  });

  router.get('/lists/companion-dialogue/:charName', async (req: Request, res: Response) => {
    let charName = <string> req.params.charName;
    charName = charName.replace(/_/g, ' ');

    res.render('pages/lists/companion-dialogue', {
      charName: charName,
      dialogue: await fetchCompanionDialogue(getControl(req), charName),
      bodyClass: ['page--companion-dialogue'],
    });
  });

  router.get('/lists/character-stories', async (req: Request, res: Response) => {
    let storiesByAvatar = await fetchCharacterStories(getControl(req));
    let avatars = Object.values(storiesByAvatar).map(x => x.avatar).sort((a,b) => a.NameText.localeCompare(b.NameText));
    res.render('pages/lists/character-stories', {
      avatars: avatars,
      bodyClass: ['page--character-stories'],
    });
  });

  router.get('/lists/character-stories/:avatarId', async (req: Request, res: Response) => {
    let story: AvatarAndFetterStoryExcelConfigData;
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

    res.render('pages/lists/character-stories', {
      avatarId: req.params.avatarId,
      story: story,
      bodyClass: ['page--character-stories'],
      tab: req.query.tab || 'display',
    });
  });

  // These are for testing purposes - making sure the global error handlers work
  router.get('/trigger-exception1', async (_req: Request, _res: Response) => {
    let thing = {};
    thing['foobar']();
  });
  router.get('/trigger-exception2', async (_req: Request, res: Response) => {
    res.render('pages/lists/character-stories');
  });

  return router;
}