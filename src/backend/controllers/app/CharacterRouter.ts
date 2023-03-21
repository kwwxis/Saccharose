import { create, Request, Response, Router } from '../../util/router';
import { HomeWorldNPCExcelConfigData } from '../../../shared/types/homeworld-types';
import { fetchCompanionDialogue, getHomeWorldCompanions } from '../../scripts/character/companion_dialogue';
import { getControl } from '../../scripts/script_util';
import { fetchCharacterStoryByAvatarId } from '../../scripts/character/fetchStoryFetters';
import { StoryFetters } from '../../../shared/types/fetter-types';
import { AvatarExcelConfigData } from '../../../shared/types/avatar-types';
import { getAvatar, getAvatars, getCompanion } from '../../middleware/avatarUtil';
import { queryTab } from '../../middleware/queryTab';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/character/VO', async (req: Request, res: Response) => {
    res.render('pages/character/vo-tool', {
      title: 'Character VO',
      bodyClass: ['page--vo-tool'],
      avatars: await getAvatars(getControl(req)),
      avatar: null
    });
  });

  router.get('/character/VO/:avatar', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const avatar: AvatarExcelConfigData = await getAvatar(ctrl, req);

    res.render('pages/character/vo-tool', {
      title: (avatar ? avatar.NameText +  ' - ' : '') + 'Character VO',
      bodyClass: ['page--vo-tool'],
      avatars: await getAvatars(ctrl),
      avatar: avatar,
      tab: queryTab(req, 'visual', 'wikitext'),
    });
  });

  router.get('/character/companion-dialogue', async (req: Request, res: Response) => {
    let companions: HomeWorldNPCExcelConfigData[] = await getHomeWorldCompanions(getControl(req));
    res.render('pages/character/companion-dialogue', {
      title: 'Companion Dialogue',
      companions: companions,
      bodyClass: ['page--companion-dialogue']
    });
  });

  router.get('/character/companion-dialogue/:avatar', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const companion: HomeWorldNPCExcelConfigData = await getCompanion(ctrl, req);

    res.render('pages/character/companion-dialogue', {
      title: 'Companion Dialogue - ' + companion.CommonName,
      companion: companion,
      dialogue: await fetchCompanionDialogue(ctrl, companion),
      bodyClass: ['page--companion-dialogue']
    });
  });

  router.get('/character/stories', async (req: Request, res: Response) => {
    res.render('pages/character/character-stories', {
      title: 'Character Stories',
      avatars: await getAvatars(getControl(req)),
      bodyClass: ['page--character-stories']
    });
  });

  router.get('/character/stories/:avatar', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const avatar: AvatarExcelConfigData = await getAvatar(ctrl, req);
    const story: StoryFetters = await fetchCharacterStoryByAvatarId(ctrl, avatar?.Id);

    res.render('pages/character/character-stories', {
      title: 'Character Stories - ' + (story?.avatar?.NameText || 'N/A'),
      avatarId: req.params.avatar,
      story: story,
      bodyClass: ['page--character-stories'],
      tab: queryTab(req, 'display', 'wikitext', ... (story.hasAlteredStories ? ['altered-display', 'altered-wikitext'] : [])),
    });
  });

  return router;
}