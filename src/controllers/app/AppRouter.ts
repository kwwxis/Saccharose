import { talkConfigGenerate } from '@/scripts/dialogue/basic_dialogue_generator';
import { AvatarAndFetterStoryExcelConfigData, fetchCharacterStories, fetchCharacterStoryByAvatarId, fetchCharacterStoryByAvatarName } from '@/scripts/dialogue/character_story';
import { fetchCompanionDialogue, fetchCompanionDialogueTalkIds } from '@/scripts/dialogue/companion_dialogue';
import { reminderGenerateAll } from '@/scripts/dialogue/reminder_generator';
import { getControl } from '@/scripts/script_util';
import { isInt, toInt } from '@functions';
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

  router.get('/branch-dialogue', async (req: Request, res: Response) => {
    res.render('pages/branch-dialogue', {
      styles: ['app.dialogue'],
      bodyClass: ['page--branch-dialogue'],
    });
  });

  router.get('/OL', async (req: Request, res: Response) => {
    res.render('pages/olgen', {
      styles: [],
      bodyClass: ['page--OL'],
    });
  });

  router.get('/npc-dialogue', async (req: Request, res: Response) => {
    res.render('pages/npc-dialogue', {
      styles: ['app.dialogue'],
      bodyClass: ['page--npc-dialogue'],
    });
  });

  router.get('/reminders', async (req: Request, res: Response) => {
    res.render('pages/reminders', {
      styles: ['app.dialogue'],
      bodyClass: ['page--reminders'],
    });
  });

  router.get('/lists/all-reminders', async (req: Request, res: Response) => {
    res.render('pages/lists/reminder-dialogue', {
      dialogue: await reminderGenerateAll(getControl(req)),
      styles: [],
      bodyClass: ['page--all-reminders'],
    });
  });

  router.get('/lists/companion-dialogue', async (req: Request, res: Response) => {
    let charNameToTalkIds = await fetchCompanionDialogueTalkIds();
    res.render('pages/lists/companion-dialogue', {
      charNames: Object.keys(charNameToTalkIds),
      styles: [],
      bodyClass: ['page--companion-dialogue'],
    });
  });

  router.get('/lists/companion-dialogue/:charName', async (req: Request, res: Response) => {
    let charName = <string> req.params.charName;
    charName = charName.replace(/_/g, ' ');

    res.render('pages/lists/companion-dialogue', {
      charName: charName,
      dialogue: await fetchCompanionDialogue(getControl(req), charName),
      styles: ['app.dialogue'],
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

    let out = null;
    if (story) {
      out = '{{Character Story';
      let i = 1;
      for (let fetter of story.fetters) {
        out += `\n|title${i}`.padEnd(16)+'= '+fetter.storyTitleText;
        if (fetter.friendship) {
          out += `\n|friendship${i}`.padEnd(16)+'= '+fetter.friendship;
        }
        out += `\n|text${i}`.padEnd(16)+'= '+fetter.storyContextHtml;
        out += `\n|mention${i}`.padEnd(16)+'= ';
        out += '\n';
        i++;
      }
      out += '}}';
    }

    if (typeof req.query.tab === 'string' && (req.query.tab !== 'wikitext' && req.query.tab !== 'display')) {
      req.query.tab = 'display';
    }

    res.render('pages/lists/character-stories', {
      avatarId: req.params.avatarId,
      story: story,
      wikitext: out,
      styles: ['app.dialogue'],
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