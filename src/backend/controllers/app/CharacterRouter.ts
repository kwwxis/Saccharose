import { create, Request, Response, Router } from '../../util/router';
import { HomeWorldNPCExcelConfigData } from '../../../shared/types/homeworld-types';
import { fetchCompanionDialogue, getHomeWorldCompanions } from '../../scripts/character/companion_dialogue';
import { Control, getControl } from '../../scripts/script_util';
import { sort } from '../../../shared/util/arrayUtil';
import {
  fetchCharacterStories,
  fetchCharacterStoryByAvatarId,
} from '../../scripts/character/fetchStoryFetters';
import { StoryFetters } from '../../../shared/types/fetter-types';
import { AvatarExcelConfigData } from '../../../shared/types/avatar-types';
import { cached } from '../../util/cache';
import jsonMask from 'json-mask';
import { createLangCodeMap } from '../../scripts/textmap';

export default async function(): Promise<Router> {
  const router: Router = create();

  const avatarMaskProps = 'Id,' +
    'QualityType,' +
    'NameText,' +
    'NameTextMapHash,' +
    'DescText,' +
    'DescTextMapHash,' +
    'InfoDescText,' +
    'InfoDescTextMapHash,' +
    'InitialWeapon,' +
    'WeaponType,' +
    'BodyType,' +
    'IconName,' +
    'ImageName,' +
    'SideIconName';

  async function getAvatars(ctrl: Control): Promise<AvatarExcelConfigData[]> {
    return cached('AvatarListCache_' + ctrl.outputLangCode, async () => {
      let storiesByAvatar = await fetchCharacterStories(ctrl);
      return Object.values(storiesByAvatar)
        .map(x => jsonMask(x.avatar, avatarMaskProps))
        .sort((a,b) => a.NameText.localeCompare(b.NameText));
    });
  }

  async function getAvatar(ctrl: Control, req: Request, res: Response): Promise<AvatarExcelConfigData> {
    const avatars = await getAvatars(ctrl);
    let avatarNameOrId: string|number = req.params.avatarId || req.params.avatarName || req.params.avatar
      || req.query.avatarId || req.query.avatarName || req.query.avatar;

    if (!avatarNameOrId) {
      return null;
    } else if (typeof avatarNameOrId === 'number') {
      return avatars.find(a => a.Id === avatarNameOrId);
    } else {
      const nameCmp = avatarNameOrId.toLowerCase().replace(/_/g, ' ');
      let ret = avatars.find(a => nameCmp === a.NameText.toLowerCase());
      if (ret) {
        return ret;
      } else {
        for (let avatar of avatars) {
          let langCodeMap = createLangCodeMap(avatar.NameTextMapHash, false);
          for (let name of Object.values(langCodeMap)) {
            if (nameCmp === name?.toLowerCase()) {
              req.context.htmlMetaProps['X-ChangeAvatarNameInURL'] = avatarNameOrId + ';' + avatar.NameText;
              return avatar;
            }
          }
        }
      }
      return null;
    }
  }

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

    const validTabs = new Set(['visualEditor', 'wikitext']);
    if (typeof req.query.tab === 'string' && !validTabs.has(req.query.tab)) {
      req.query.tab = 'visualEditor';
    }

    let avatar: AvatarExcelConfigData = await getAvatar(ctrl, req, res);

    res.render('pages/character/vo-tool', {
      title: (avatar ? avatar.NameText +  ' - ' : '') + 'Character VO',
      bodyClass: ['page--vo-tool'],
      avatars: await getAvatars(ctrl),
      avatar: avatar,
      tab: req.query.tab || 'visualEditor',
    });
  });

  router.get('/character/companion-dialogue', async (req: Request, res: Response) => {
    let companions: HomeWorldNPCExcelConfigData[] = await getHomeWorldCompanions(getControl(req));
    let characters = companions.map(c =>
      c.Avatar
        ? { name: c.Avatar.NameText, icon: c.Avatar.IconName }
        : { name: c.Npc.NameText, icon: c.FrontIcon }
    );
    sort(characters, 'name');
    res.render('pages/character/companion-dialogue', {
      title: 'Companion Dialogue',
      characters: characters,
      bodyClass: ['page--companion-dialogue']
    });
  });

  router.get('/character/companion-dialogue/:avatar', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const avatar: AvatarExcelConfigData = await getAvatar(ctrl, req, res);
    res.render('pages/character/companion-dialogue', {
      title: 'Companion Dialogue - ' + (avatar?.NameText || req.params.avatar),
      avatar: avatar,
      dialogue: await fetchCompanionDialogue(ctrl, avatar ? avatar.Id : req.params.avatar),
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
    const avatar: AvatarExcelConfigData = await getAvatar(ctrl, req, res);
    const story: StoryFetters = await fetchCharacterStoryByAvatarId(ctrl, avatar?.Id);

    let validTabs = new Set(['wikitext', 'display', 'altered-wikitext', 'altered-display']);
    if (typeof req.query.tab === 'string') {
      if (!validTabs.has(req.query.tab)) {
        req.query.tab = 'display';
      }
      if (!story.hasAlteredStories && req.query.tab.startsWith('altered-')) {
        req.query.tab = req.query.tab.slice('altered-'.length);
      }
    }

    res.render('pages/character/character-stories', {
      title: 'Character Stories - ' + (story?.avatar?.NameText || 'N/A'),
      avatarId: req.params.avatarId,
      story: story,
      bodyClass: ['page--character-stories'],
      tab: req.query.tab || 'display',
    });
  });

  return router;
}