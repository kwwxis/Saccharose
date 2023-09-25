import { pageMatch } from '../../../pageMatch';
import { initializeVoTool } from '../../generic/vo-tool/vo-tool';
import {
  CommonAvatar,
  CommonVoiceOverGroup,
  toCommonVoiceOverGroupFromStarRail,
} from '../../../../shared/types/common-types';
import { AvatarConfig, isTrailblazer, VoiceAtlasGroup } from '../../../../shared/types/hsr/hsr-avatar-types';
import { starRailEndpoints } from '../../../endpoints';

pageMatch('pages/hsr/character/vo-tool', () => {
  initializeVoTool(() => ({
    storagePrefix: 'HSR_',
    imagePathPrefix: '/images/hsr/',

    async fetchVoiceCollection(avatar: CommonAvatar): Promise<CommonVoiceOverGroup> {
      const atlasGroup: VoiceAtlasGroup = await starRailEndpoints.getVoiceAtlasGroup.get({ avatarId: avatar.Id });
      return toCommonVoiceOverGroupFromStarRail(atlasGroup);
    },

    isMainCharacter(avatar: CommonAvatar<AvatarConfig>): boolean {
      return isTrailblazer(avatar.Original);
    },

    preloadConfig: null,
  }));
});