import { talkConfigGenerate } from '@/scripts/dialogue/basic_dialogue_generator';
import { fetchCharacterStories } from '@/scripts/dialogue/character_story';
import { fetchCompanionDialogueTalkIds } from '@/scripts/dialogue/companion_dialogue';
import { getControl } from '@/scripts/script_util';
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

  router.get('/lists/companion-dialogue', async (req: Request, res: Response) => {
    res.render('pages/lists/companion-dialogue', {
      charNameToTalkId: await fetchCompanionDialogueTalkIds(),
      styles: [],
      bodyClass: ['page--companion-dialogue'],
    });
  });

  router.get('/lists/companion-dialogue/:talkId', async (req: Request, res: Response) => {
    res.render('pages/lists/companion-dialogue', {
      dialogue: await talkConfigGenerate(getControl(req), toInt(req.params.talkId)),
      styles: ['app.dialogue'],
      bodyClass: ['page--companion-dialogue'],
    });
  });

  router.get('/lists/character-stories', async (req: Request, res: Response) => {
    let storiesByAvatar = await fetchCharacterStories(getControl(req));
    let avatars = Object.values(storiesByAvatar).map(x => x.avatar);
    res.render('pages/lists/character-stories', {
      avatars: avatars,
      bodyClass: ['page--character-stories'],
    });
  });

  router.get('/lists/character-stories/:avatarId', async (req: Request, res: Response) => {
    let avatarId = toInt(req.params.avatarId);
    let storiesByAvatar = await fetchCharacterStories(getControl(req));
    let story = storiesByAvatar[avatarId];

    let out = '{{Character Story';
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

    res.render('pages/lists/character-stories', {
      story: story,
      wikitext: out,
      styles: ['app.dialogue'],
      bodyClass: ['page--character-stories'],
      tab: req.query.tab || 'display',
    });
  });

  return router;
}