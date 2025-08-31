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
import StarRailMessages from '../../../components/hsr/StarRailMessages.vue';
import SharedVoTool from '../../../components/shared/SharedVoTool.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/avatar-test', async (req: Request, res: Response) => {
    const ctrl = getStarRailControl(req);
    const avatars: AvatarConfig[] = await getStarRailAvatars(ctrl);

    await res.renderComponent(StarRailMessages, {
      title: 'Messages',
      bodyClass: ['page--messages'],
      avatars
    });
  });

  router.get('/character/VO', async (req: Request, res: Response) => {
    const ctrl = getStarRailControl(req);
    const avatars: CommonAvatar[] = toCommonAvatarsFromStarRail(await getStarRailAvatars(ctrl));

    await res.renderComponent(SharedVoTool, {
      title: 'Character VO',
      bodyClass: ['page--wide', 'page--vo-tool', 'page--hsr-vo-tool'],
      avatars,
      avatar: null,
      avatarLabel: 'Character',
      avatarLabelPlural: 'Characters',
      pageUrl: '/character/VO',
      tab: null,
      normText: ctrl.normText.bind(ctrl),
      appSidebarOverlayScroll: true,
      voLangCode: null,
      voLangName: null
    });
  });

  router.get('/character/VO/:avatar', async (req: Request, res: Response) => {
    res.redirect(`/hsr/character/VO/${req.params.avatar}/EN`);
  });

  router.get('/character/VO/:avatar/:voLangCode', async (req: Request, res: Response) => {
    const ctrl = getStarRailControl(req);
    const avatars: CommonAvatar[] = toCommonAvatarsFromStarRail(await getStarRailAvatars(ctrl));
    const avatar: CommonAvatar = toCommonAvatarFromStarRail(await getStarRailAvatar(ctrl, req));
    const tab = queryTab(req, 'visual', 'wikitext');
    const voLangCode: LangCode = paramOption(req, 'voLangCode', 'EN', 'CH', 'JP', 'KR');
    const voLangName: string = LANG_CODES_TO_NAME[voLangCode];

    await res.renderComponent(SharedVoTool, {
      title: (avatar ? avatar.NameText +  ' - ' : '') + 'Character VO',
      bodyClass: ['page--wide', 'page--vo-tool', `tab--${tab}`, 'page--hsr-vo-tool'],
      avatars,
      avatar,
      avatarLabel: 'Character',
      avatarLabelPlural: 'Characters',
      pageUrl: '/character/VO',
      tab,
      normText: ctrl.normText.bind(ctrl),
      appSidebarOverlayScroll: true,
      voLangCode,
      voLangName,
    });
  });

  return router;
}
