import { create } from '../../../routing/router.ts';
import { HomeWorldNPCExcelConfigData } from '../../../../shared/types/genshin/homeworld-types.ts';
import { fetchCompanionDialogue, getHomeWorldCompanions } from '../../../domain/genshin/character/companion_dialogue.ts';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import { fetchCharacterStoryByAvatarId } from '../../../domain/genshin/character/fetchStoryFetters.ts';
import { StoryFetters } from '../../../../shared/types/genshin/fetter-types.ts';
import { AvatarExcelConfigData } from '../../../../shared/types/genshin/avatar-types.ts';
import { getGenshinAvatar, getGenshinAvatars, getCompanion } from '../../../middleware/game/genshinAvatarUtil.ts';
import { paramOption, queryTab } from '../../../middleware/util/queryTab.ts';
import { Request, Response, Router } from 'express';
import {
  CommonAvatar,
  toCommonAvatarFromGenshin,
  toCommonAvatarsFromGenshin,
} from '../../../../shared/types/common-types.ts';
import { LANG_CODES_TO_NAME, LangCode } from '../../../../shared/types/lang-types.ts';
import SharedVoTool from '../../../components/shared/SharedVoTool.vue';
import CompanionDialoguePage from '../../../components/genshin/characters/CompanionDialoguePage.vue';
import CharacterStoriesPage from '../../../components/genshin/characters/CharacterStoriesPage.vue';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/character/VO', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const avatars: CommonAvatar[] = toCommonAvatarsFromGenshin(await getGenshinAvatars(ctrl, false));

    await res.renderComponent(SharedVoTool, {
      title: 'Character VO',
      bodyClass: ['page--wide', 'page--vo-tool', 'page--genshin-vo-tool'],
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
    res.redirect(`/genshin/character/VO/${req.params.avatar}/EN`);
  });

  router.get('/character/VO/:avatar/:voLangCode', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const avatars: CommonAvatar[] = toCommonAvatarsFromGenshin(await getGenshinAvatars(ctrl, false));
    const avatar: CommonAvatar = toCommonAvatarFromGenshin(await getGenshinAvatar(ctrl, req, false));
    const tab = queryTab(req, 'visual', 'wikitext');
    const voLangCode: LangCode = paramOption(req, 'voLangCode', 'EN', 'CH', 'JP', 'KR');
    const voLangName: string = LANG_CODES_TO_NAME[voLangCode];

    await res.renderComponent(SharedVoTool, {
      title: (avatar ? avatar.NameText +  ' - ' : '') + 'Character VO',
      bodyClass: ['page--wide', 'page--vo-tool', `tab--${tab}`, 'page--genshin-vo-tool'],
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

  router.get('/character/companion-dialogue', async (req: Request, res: Response) => {
    let companions: HomeWorldNPCExcelConfigData[] = await getHomeWorldCompanions(getGenshinControl(req));
    await res.renderComponent(CompanionDialoguePage, {
      title: 'Companion Dialogue',
      companions: companions,
      bodyClass: ['page--companion-dialogue']
    });
  });

  router.get('/character/companion-dialogue/:avatar', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const companion: HomeWorldNPCExcelConfigData = await getCompanion(ctrl, req);

    await res.renderComponent(CompanionDialoguePage, {
      title: 'Companion Dialogue - ' + (companion?.CommonName || 'Not Found'),
      companion: companion,
      dialogue: (await fetchCompanionDialogue(ctrl, companion)) || [],
      bodyClass: ['page--companion-dialogue']
    });
  });

  router.get('/character/stories', async (req: Request, res: Response) => {
    await res.renderComponent(CharacterStoriesPage, {
      title: 'Character Stories',
      avatars: await getGenshinAvatars(getGenshinControl(req), true),
      bodyClass: ['page--character-stories']
    });
  });

  router.get('/character/stories/:avatar', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const avatar: AvatarExcelConfigData = await getGenshinAvatar(ctrl, req, true);
    const story: StoryFetters = await fetchCharacterStoryByAvatarId(ctrl, avatar?.Id);

    await res.renderComponent(CharacterStoriesPage, {
      title: 'Character Stories - ' + (story?.avatar?.NameText || 'N/A'),
      avatar,
      avatarId: req.params.avatar,
      story: story,
      bodyClass: ['page--character-stories'],
      tab: queryTab(req, 'display', 'wikitext', ... (story?.hasAlteredStories ? ['altered-display', 'altered-wikitext'] : [])),
    });
  });

  return router;
}
