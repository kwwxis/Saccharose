import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import { getWuwaControl } from '../../../domain/wuwa/wuwaControl.ts';
import { getWuwaRole, getWuwaRoles } from '../../../middleware/game/wuwaRoleUtil.ts';
import {
  CommonAvatar,
  toCommonAvatarFromWuwa,
  toCommonAvatarsFromWuwa,
} from '../../../../shared/types/common-types.ts';
import { paramOption, queryTab } from '../../../middleware/util/queryTab.ts';
import { LANG_CODES_TO_NAME, LangCode } from '../../../../shared/types/lang-types.ts';
import SharedVoTool from '../../../components/shared/SharedVoTool.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/resonator/VO', async (req: Request, res: Response) => {
    const ctrl = getWuwaControl(req);
    const avatars: CommonAvatar[] = toCommonAvatarsFromWuwa(await getWuwaRoles(ctrl));

    await res.renderComponent(SharedVoTool, {
      title: 'Resonator VO',
      bodyClass: ['page--wide', 'page--vo-tool', 'page--wuwa-vo-tool'],
      avatars,
      avatar: null,
      avatarLabel: 'Resonator',
      avatarLabelPlural: 'Resonators',
      pageUrl: '/resonator/VO',
      tab: null,
      normText: ctrl.normText.bind(ctrl),
      appSidebarOverlayScroll: true,
      voLangCode: null,
      voLangName: null
    });
  });

  router.get('/resonator/VO/:role', async (req: Request, res: Response) => {
    res.redirect(`/wuwa/resonator/VO/${req.params.role}/EN`);
  });

  router.get('/resonator/VO/:role/:voLangCode', async (req: Request, res: Response) => {
    const ctrl = getWuwaControl(req);
    const avatars: CommonAvatar[] = toCommonAvatarsFromWuwa(await getWuwaRoles(ctrl));
    const avatar: CommonAvatar = toCommonAvatarFromWuwa(await getWuwaRole(ctrl, req));
    const tab = queryTab(req, 'visual', 'wikitext');
    const voLangCode: LangCode = paramOption(req, 'voLangCode', 'EN', 'CH', 'JP', 'KR');
    const voLangName: string = LANG_CODES_TO_NAME[voLangCode];

    await res.renderComponent(SharedVoTool, {
      title: (avatar ? avatar.NameText +  ' - ' : '') + 'Resonator VO',
      bodyClass: ['page--wide', 'page--vo-tool', `tab--${tab}`, 'page--wuwa-vo-tool'],
      avatars,
      avatar,
      avatarLabel: 'Resonator',
      avatarLabelPlural: 'Resonators',
      pageUrl: '/resonator/VO',
      tab,
      normText: ctrl.normText.bind(ctrl),
      appSidebarOverlayScroll: true,
      voLangCode,
      voLangName,
    });
  });

  return router;
}
