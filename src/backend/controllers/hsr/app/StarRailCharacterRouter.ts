import { Request, Response, Router } from 'express';
import { create } from '../../../routing/router.ts';
import {
  CommonAvatar,
  toCommonAvatarFromStarRail,
  toCommonAvatarsFromStarRail,
} from '../../../../shared/types/common-types.ts';
import { paramOption, queryTab } from '../../../middleware/util/queryTab.ts';
import { getStarRailControl } from '../../../domain/hsr/starRailControl.ts';
import { getStarRailAvatar, getStarRailAvatars } from '../../../middleware/game/starRailAvatarUtil.ts';
import { AvatarConfig } from '../../../../shared/types/hsr/hsr-avatar-types.ts';
import { LANG_CODES_TO_NAME, LangCode } from '../../../../shared/types/lang-types.ts';
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
      normText: ctrl.normText.bind(ctrl),
      appSidebarOverlayScroll: true,
      voLangCode: null,
      voLangName: null
    });
  });

  router.get('/character/VO/:avatar', async (req: Request, res: Response) => {
    res.redirect(`/character/VO/${req.params.avatar}/EN`);
  });

  router.get('/character/VO/:avatar/:voLangCode', async (req: Request, res: Response) => {
    const ctrl = getStarRailControl(req);
    const avatars: CommonAvatar[] = toCommonAvatarsFromStarRail(await getStarRailAvatars(ctrl));
    const avatar: CommonAvatar = toCommonAvatarFromStarRail(await getStarRailAvatar(ctrl, req));
    const tab = queryTab(req, 'visual', 'wikitext');
    const voLangCode: LangCode = paramOption(req, 'voLangCode', 'EN', 'CH', 'JP', 'KR');
    const voLangName: string = LANG_CODES_TO_NAME[voLangCode];

    res.render('pages/hsr/character/vo-tool', {
      title: (avatar ? avatar.NameText +  ' - ' : '') + 'Character VO',
      bodyClass: ['page--wide', 'page--vo-tool', `tab--${tab}`],
      avatars,
      avatar,
      tab,
      normText: ctrl.normText.bind(ctrl),
      appSidebarOverlayScroll: true,
      voLangCode,
      voLangName,
    });
  });

  return router;
}