import { Request, Response, Router } from 'express';
import { create } from '../../../routing/router';
import {
  CommonAvatar,
  toCommonAvatarFromStarRail,
  toCommonAvatarsFromStarRail,
} from '../../../../shared/types/common-types';
import { queryTab } from '../../../middleware/util/queryTab';
import { getStarRailControl } from '../../../domain/hsr/starRailControl';
import { getStarRailAvatar, getStarRailAvatars } from '../../../middleware/game/starRailAvatarUtil';
import { AvatarConfig } from '../../../../shared/types/hsr/hsr-avatar-types';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/avatar-test', async (req: Request, res: Response) => {
    const ctrl = getStarRailControl(req);
    const avatars: AvatarConfig[] = await getStarRailAvatars(ctrl);

    res.render('pages/hsr/character/messages', {
      title: 'Messages',
      bodyClass: ['page--messages'],
      avatars
    });
  });

  router.get('/character/VO', async (req: Request, res: Response) => {
    const ctrl = getStarRailControl(req);
    const avatars: CommonAvatar[] = toCommonAvatarsFromStarRail(await getStarRailAvatars(ctrl));

    res.render('pages/hsr/character/vo-tool', {
      title: 'Character VO',
      bodyClass: ['page--wide', 'page--vo-tool'],
      avatars,
      avatar: null,
      tab: null,
      normText: ctrl.normText.bind(ctrl)
    });
  });

  router.get('/character/VO/:avatar', async (req: Request, res: Response) => {
    const ctrl = getStarRailControl(req);
    const avatars: CommonAvatar[] = toCommonAvatarsFromStarRail(await getStarRailAvatars(ctrl));
    const avatar: CommonAvatar = toCommonAvatarFromStarRail(await getStarRailAvatar(ctrl, req));

    res.render('pages/hsr/character/vo-tool', {
      title: (avatar ? avatar.NameText +  ' - ' : '') + 'Character VO',
      bodyClass: ['page--wide', 'page--vo-tool'],
      avatars,
      avatar,
      tab: queryTab(req, 'visual', 'wikitext'),
      normText: ctrl.normText.bind(ctrl)
    });
  });

  return router;
}