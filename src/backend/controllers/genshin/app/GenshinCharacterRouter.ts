import { create } from '../../../routing/router';
import { HomeWorldNPCExcelConfigData } from '../../../../shared/types/genshin/homeworld-types';
import { fetchCompanionDialogue, getHomeWorldCompanions } from '../../../domain/genshin/character/companion_dialogue';
import { getGenshinControl } from '../../../domain/genshin/genshinControl';
import { fetchCharacterStoryByAvatarId } from '../../../domain/genshin/character/fetchStoryFetters';
import { StoryFetters } from '../../../../shared/types/genshin/fetter-types';
import { AvatarExcelConfigData } from '../../../../shared/types/genshin/avatar-types';
import { getGenshinAvatar, getGenshinAvatars, getCompanion } from '../../../middleware/game/genshinAvatarUtil';
import { queryTab } from '../../../middleware/util/queryTab';
import { Request, Response, Router } from 'express';
import {
  CommonAvatar,
  toCommonAvatarFromGenshin,
  toCommonAvatarsFromGenshin,
} from '../../../../shared/types/common-types';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/character/VO', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const avatars: CommonAvatar[] = toCommonAvatarsFromGenshin(await getGenshinAvatars(ctrl));

    res.render('pages/genshin/character/vo-tool', {
      title: 'Character VO',
      bodyClass: ['page--wide', 'page--vo-tool'],
      avatars,
      avatar: null,
      tab: null,
      normText: ctrl.normText.bind(ctrl)
    });
  });

  router.get('/character/VO/:avatar', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const avatars: CommonAvatar[] = toCommonAvatarsFromGenshin(await getGenshinAvatars(ctrl));
    const avatar: CommonAvatar = toCommonAvatarFromGenshin(await getGenshinAvatar(ctrl, req));

    res.render('pages/genshin/character/vo-tool', {
      title: (avatar ? avatar.NameText +  ' - ' : '') + 'Character VO',
      bodyClass: ['page--wide', 'page--vo-tool'],
      avatars,
      avatar,
      tab: queryTab(req, 'visual', 'wikitext'),
      normText: ctrl.normText.bind(ctrl)
    });
  });

  router.get('/character/companion-dialogue', async (req: Request, res: Response) => {
    let companions: HomeWorldNPCExcelConfigData[] = await getHomeWorldCompanions(getGenshinControl(req));
    res.render('pages/genshin/character/companion-dialogue', {
      title: 'Companion Dialogue',
      companions: companions,
      bodyClass: ['page--companion-dialogue']
    });
  });

  router.get('/character/companion-dialogue/:avatar', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const companion: HomeWorldNPCExcelConfigData = await getCompanion(ctrl, req);

    res.render('pages/genshin/character/companion-dialogue', {
      title: 'Companion Dialogue - ' + companion.CommonName,
      companion: companion,
      dialogue: await fetchCompanionDialogue(ctrl, companion),
      bodyClass: ['page--companion-dialogue']
    });
  });

  router.get('/character/stories', async (req: Request, res: Response) => {
    res.render('pages/genshin/character/character-stories', {
      title: 'Character Stories',
      avatars: await getGenshinAvatars(getGenshinControl(req)),
      bodyClass: ['page--character-stories']
    });
  });

  router.get('/character/stories/:avatar', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const avatar: AvatarExcelConfigData = await getGenshinAvatar(ctrl, req);
    const story: StoryFetters = await fetchCharacterStoryByAvatarId(ctrl, avatar?.Id);

    res.render('pages/genshin/character/character-stories', {
      title: 'Character Stories - ' + (story?.avatar?.NameText || 'N/A'),
      avatarId: req.params.avatar,
      story: story,
      bodyClass: ['page--character-stories'],
      tab: queryTab(req, 'display', 'wikitext', ... (story.hasAlteredStories ? ['altered-display', 'altered-wikitext'] : [])),
    });
  });

  return router;
}