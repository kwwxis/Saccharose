import { pageMatch } from '../../../pageMatch';
import { initializeVoTool } from '../../generic/vo-tool/vo-tool';
import { genshinVoPreload } from './genshin-vo-preload';
import {
  CommonAvatar,
  CommonVoiceCollection,
  toCommonVoiceCollectionFromGenshin,
} from '../../../../shared/types/common-types';
import { genshinEndpoints } from '../../../endpoints';
import { CharacterFetters } from '../../../../shared/types/genshin/fetter-types';
import { AvatarExcelConfigData, isTraveler } from '../../../../shared/types/genshin/avatar-types';
import { VoAppPreloadResult } from '../../generic/vo-tool/vo-preload-support';

pageMatch('pages/genshin/character/vo-tool', () => {
  initializeVoTool(() => {
    return {
      storagePrefix: 'GENSHIN_',
      imagePathPrefix: '/images/genshin/',

      preloader(state, mode, lang, userLang, opts): VoAppPreloadResult {
        return genshinVoPreload(state, mode, lang, userLang, opts);
      },

      async fetchVoiceCollection(avatar: CommonAvatar): Promise<CommonVoiceCollection<CharacterFetters>> {
        const fetters: CharacterFetters = await genshinEndpoints.getFetters.get({ avatarId: avatar.Id });
        return toCommonVoiceCollectionFromGenshin(fetters);
      },

      isMainCharacter(avatar: CommonAvatar<AvatarExcelConfigData>): boolean {
        return isTraveler(avatar.Original);
      }
    }
  });
});