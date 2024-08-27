import { pageMatch } from '../../../core/pageMatch.ts';
import { initializeVoTool } from '../../generic/vo-tool/vo-tool.ts';
import {
  CommonAvatar, CommonVoiceOver,
  CommonVoiceOverGroup,
  toCommonVoiceOverGroupFromStarRail,
} from '../../../../shared/types/common-types.ts';
import {
  AvatarConfig,
  isTrailblazer,
  VoiceAtlas,
  VoiceAtlasGroup,
} from '../../../../shared/types/hsr/hsr-avatar-types.ts';
import { starRailEndpoints } from '../../../core/endpoints.ts';
import {
  VoAppPreloadCombatGroupCodeConf,
  VoAppPreloadConfig,
  VoAppPreloadInput,
} from '../../generic/vo-tool/vo-preload-types.ts';
import { enforcePropOrderItem } from '../../generic/vo-tool/vo-handle.ts';
import { replaceRomanNumerals, romanToInt, SbOut } from '../../../../shared/util/stringUtil.ts';

// region General Config
// --------------------------------------------------------------------------------------------------------------
pageMatch('pages/hsr/character/vo-tool', async () => {
  await initializeVoTool(() => ({
    async fetchVoiceCollection(avatar: CommonAvatar): Promise<CommonVoiceOverGroup> {
      const atlasGroup: VoiceAtlasGroup = await starRailEndpoints.getVoiceAtlasGroup.send({ avatarId: avatar.Id });
      return toCommonVoiceOverGroupFromStarRail(atlasGroup);
    },

    pageUrl: '/character/VO',
    mainCharacterLabel: 'Trailblazer',
    isMainCharacter(avatar: CommonAvatar<AvatarConfig>): boolean {
      return isTrailblazer(avatar.Original);
    },

    preloadConfig: new StarRailVoAppPreloadConfig(),

    enforcePropOrder: [
      ... enforcePropOrderItem('title'),
      ... enforcePropOrderItem('subtitle'),
      ... enforcePropOrderItem('mission'),
      ... enforcePropOrderItem('hidden'),
      ... enforcePropOrderItem('file'),
      ... enforcePropOrderItem('file_male'),
      ... enforcePropOrderItem('file_female'),
      ... enforcePropOrderItem('tx'),
      ... enforcePropOrderItem('rm'),
      ... enforcePropOrderItem('tl'),
      ... enforcePropOrderItem('actualtx'),
      ... enforcePropOrderItem('actualrm'),
      ... enforcePropOrderItem('actualtl'),
      ... enforcePropOrderItem('mention')
    ],

    storyTemplateNames: [
      'VO/Data Bank',
      'VO/Trailblazer',
    ],
    combatTemplateNames: [
      'Combat VO',
      'Combat VO/Trailblazer'
    ]
  }));
});
// endregion

// region Preload Config
// --------------------------------------------------------------------------------------------------------------
export class StarRailVoAppPreloadConfig extends VoAppPreloadConfig {

  // region General Preload Info
  // ------------------------------------------------------------------------------------------------------------
  override getTemplateName(input: VoAppPreloadInput): string {
    if (input.isMainCharacter) {
      if (input.isCombat) {
        return 'Combat VO/Trailblazer';
      } else {
        return 'VO/Trailblazer';
      }
    } else {
      if (input.isCombat) {
        return 'Combat VO';
      } else {
        return 'VO/Data Bank';
      }
    }
  }
  // endregion

  // region Story Preload Config
  // ------------------------------------------------------------------------------------------------------------
  override getStoryFileName(input: VoAppPreloadInput): string {
    const number = input.voiceOver.VoiceFile.match(/(\d+)\.ogg/)?.[1];
    if (number) {
      return `VO_{language}_Archive_{character}_${number}.ogg`
    } else {
      let title = input.voiceOver.TitleTextMap.EN;
      title = title.replace(/:/g, ' -');
      title = title.replace(input.avatarName.EN, '{character}');
      title = replaceRomanNumerals(title, roman => String(romanToInt(roman)).padStart(2, '0'));

      return `VO_{language}_Archive_{character} ${title}.ogg`
    }
  }

  override getStoryGroupName(input: VoAppPreloadInput): string {
    const { voiceOver, storyContext } = input;
    let titleEN = voiceOver.TitleTextMap.EN.toLowerCase();

    if (titleEN.startsWith('first meeting')) {
      return 'First Meeting';
    } else if (titleEN.startsWith('greeting') || titleEN.startsWith('parting')) {
      return 'Greeting/Parting';
    } else if (titleEN.startsWith('about self:')) {
      return 'About Self';
    } else if (titleEN.startsWith('chat:')) {
      return 'Chat';
    } else if (titleEN.startsWith('about us')) {
      return 'About Us';
    } else if (titleEN.startsWith('hobbies') || titleEN.startsWith('annoyances')) {
      return 'Hobbies/Annoyances';
    } else if (titleEN.startsWith('something to share') || titleEN.startsWith('knowledge')) {
      return 'Something to Share/Knowledge';
    } else if (titleEN.startsWith('about ')) {
      return 'About Others';
    } else if (titleEN.includes('eidolon') || titleEN.includes('character ascension') || titleEN.includes('max level') || titleEN.includes('trace activation')) {
      return 'Character Upgrade';
    } else if (titleEN.includes('added to team')) {
      return 'Added to Team';
    } else {
      return 'Unknown'
    }
  }

  override runStoryExtraHook(input: VoAppPreloadInput) {
    const out: SbOut = input.out;
    const voiceOver: CommonVoiceOver<VoiceAtlas> = input.voiceOver;

    const voiceAtlas = voiceOver.Original;
    if (voiceAtlas.UnlockMissionNameTextMap) {
      out.prop('mission', voiceAtlas.UnlockMissionNameTextMap[input.userLang]);
    }
  }
  // endregion

  // region Combat Preload Config
  // ------------------------------------------------------------------------------------------------------------
  getCombatGroupCode(input: VoAppPreloadInput): string {
    let titleEN: string = input.voiceOver.TitleTextMap.EN.toLowerCase();
    if (titleEN.startsWith('battle begins: weakness')) {
      return 'b-begin-w';
    } else if (titleEN.startsWith('battle begins: danger')) {
      return 'b-begin-d';
    } else if (titleEN.startsWith('turn begins')) {
      return 't-begin';
    } else if (titleEN.startsWith('turn idling')) {
      return 't-idle';

    } else if (titleEN.startsWith('basic atk')) {
      return 'basic_atk';
    } else if (titleEN.startsWith('skill')) {
      return 'skill';
    } else if (titleEN.startsWith('talent')) {
      return 'talent';
    } else if (titleEN.startsWith('ultimate: activate')) {
      return 'ulti-activate';
    } else if (titleEN.startsWith('ultimate: unleash')) {
      return 'ulti-unleash';
    } else if (titleEN.startsWith('technique')) {
      return 'technique';

    } else if (titleEN.includes('light attack')) {
      return 'hit-light';
    } else if (titleEN.includes('heavy attack')) {
      return 'hit-heavy';

    } else if (titleEN.startsWith('downed')) {
      return 'downed';
    } else if (titleEN.startsWith('return to battle')) {
      return 'revived';
    } else if (titleEN.startsWith('health recovery')) {
      return 'heal';

    } else if (titleEN.startsWith('battle won')) {
      return 'win';
    } else if (titleEN.startsWith('treasure opening')) {
      return 'treasure';
    } else if (titleEN.startsWith('precious treasure opening')) {
      return 'precious';
    } else if (titleEN.includes('puzzle-solving')) {
      return 'puzzle';
    } else if (titleEN.startsWith('enemy target found')) {
      return 'enemy-found';
    } else if (titleEN.startsWith('returning to town')) {
      return 'town';

    // } else if (titleEN.startsWith('')) {
    //   return 'idle';

    } else {
      console.log('[VO-App] Was unable to determine combat group for voice-over', input.voiceOver);
      return 'unknown';
    }
  }

  override getCombatGroupCodes(input: VoAppPreloadInput): Map<string, VoAppPreloadCombatGroupCodeConf> {
    const combatGroupCodes = new Map<string, VoAppPreloadCombatGroupCodeConf>();
    combatGroupCodes.set('b-begin-w', { groupTitle: 'Battle Begin: Weakeness', animEvtFileMatch: null });
    combatGroupCodes.set('b-begin-d', { groupTitle: 'Battle Begin: Danger', animEvtFileMatch: null });

    combatGroupCodes.set('t-begin', { groupTitle: 'Turn Begin', animEvtFileMatch: null });
    combatGroupCodes.set('t-idle', { groupTitle: 'Turn Idle', animEvtFileMatch: null });

    combatGroupCodes.set('skill', { groupTitle: 'Skill', animEvtFileMatch: null });
    combatGroupCodes.set('basic_atk', { groupTitle: 'Basic Attack', animEvtFileMatch: null });
    combatGroupCodes.set('talent', { groupTitle: 'Talent', animEvtFileMatch: null });
    combatGroupCodes.set('ulti-activate', { groupTitle: 'Ultimate Activate', animEvtFileMatch: null });
    combatGroupCodes.set('ulti-unleash', { groupTitle: 'Ultimate Unleash', animEvtFileMatch: null });
    combatGroupCodes.set('technique', { groupTitle: 'Technique', animEvtFileMatch: null });

    combatGroupCodes.set('hit-light', { groupTitle: 'Hit Light', animEvtFileMatch: null });
    combatGroupCodes.set('hit-heavy', { groupTitle: 'Hit Heavy', animEvtFileMatch: null });

    combatGroupCodes.set('downed', { groupTitle: 'Downed', animEvtFileMatch: null });
    combatGroupCodes.set('revived', { groupTitle: 'Revived', animEvtFileMatch: null });
    combatGroupCodes.set('heal', { groupTitle: 'Heal', animEvtFileMatch: null });

    combatGroupCodes.set('win', { groupTitle: 'Battle Won', animEvtFileMatch: null });
    combatGroupCodes.set('treasure', { groupTitle: 'Treasure Opening', animEvtFileMatch: null });
    combatGroupCodes.set('precious', { groupTitle: 'Precious Treasure Opening', animEvtFileMatch: null });
    combatGroupCodes.set('puzzle', { groupTitle: 'Puzzle Solving', animEvtFileMatch: null });
    combatGroupCodes.set('enemy-found', { groupTitle: 'Enemy Found', animEvtFileMatch: null });
    combatGroupCodes.set('town', { groupTitle: 'Returning to Town', animEvtFileMatch: null });

    return combatGroupCodes;
  }
  // endregion
}
// endregion
