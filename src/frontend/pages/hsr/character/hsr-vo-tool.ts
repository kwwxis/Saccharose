import { pageMatch } from '../../../pageMatch';
import { initializeVoTool } from '../../generic/vo-tool/vo-tool';
import {
  CommonAvatar,
  CommonVoiceCollection,
} from '../../../../shared/types/common-types';
import { AvatarConfig, isTrailblazer } from '../../../../shared/types/hsr/hsr-avatar-types';
import { VoAppPreloadResult } from '../../generic/vo-tool/vo-preload-support';

pageMatch('pages/hsr/character/vo-tool', () => {
  initializeVoTool(() => {
    return {
      storagePrefix: 'HSR_',
      imagePathPrefix: '/images/hsr/',

      preloader(state, mode, lang, userLang, opts): VoAppPreloadResult {
        return { templateName: 'VO', wikitext: '(Not implemented)' };
      },

      async fetchVoiceCollection(avatar: CommonAvatar): Promise<CommonVoiceCollection> {
        // const fetters: CharacterFetters = await genshinEndpoints.getFetters.get({ avatarId: avatar.Id });
        // return toCommonVoiceCollectionFromGenshin(fetters);
        return {
          avatar: avatar,
          avatarName: null,
          voAvatarName: '',
          storyItems: [],
          combatItems: [],
          original: null
        }
      },

      isMainCharacter(avatar: CommonAvatar<AvatarConfig>): boolean {
        return isTrailblazer(avatar.Original);
      }
    }
  });
});