import { pageMatch } from '../../../core/pageMatch.ts';
import { initializeVoTool } from '../../generic/vo-tool/vo-tool.ts';
import {
  CommonAvatar, CommonVoiceOver,
  CommonVoiceOverGroup,
  toCommonVoiceOverGroupFromWuwa,
} from '../../../../shared/types/common-types.ts';
import { wuwaEndpoints } from '../../../core/endpoints.ts';
import {
  VoAppPreloadCombatGroupCodeConf,
  VoAppPreloadConfig,
  VoAppPreloadInput,
} from '../../generic/vo-tool/vo-preload-types.ts';
import { enforcePropOrderItem } from '../../generic/vo-tool/vo-handle.ts';
import { replaceRomanNumerals, romanToInt, SbOut } from '../../../../shared/util/stringUtil.ts';
import { FavorWord, FavorWordGroup } from '../../../../shared/types/wuwa/favor-types.ts';
import { isRover, RoleInfo } from '../../../../shared/types/wuwa/role-types.ts';

// region General Config
// --------------------------------------------------------------------------------------------------------------
pageMatch('pages/wuwa/resonator/vo-tool', async () => {
  await initializeVoTool(() => ({
    async fetchVoiceCollection(avatar: CommonAvatar): Promise<CommonVoiceOverGroup> {
      const favorWordGroup: FavorWordGroup = await wuwaEndpoints.getFavorWordGroup.get({ roleId: avatar.Id });
      return toCommonVoiceOverGroupFromWuwa(favorWordGroup);
    },

    pageUrl: '/resonator/VO',
    mainCharacterLabel: 'Rover',
    isMainCharacter(avatar: CommonAvatar<RoleInfo>): boolean {
      return isRover(avatar.Original);
    },

    preloadConfig: new WuwaVoAppPreloadConfig(),

    enforcePropOrder: [
      ... enforcePropOrderItem('title'),
      ... enforcePropOrderItem('subtitle'),
      ... enforcePropOrderItem('quest'),
      ... enforcePropOrderItem('intimacy'),
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
      'VO'
    ],
    combatTemplateNames: [
      'Combat VO'
    ]
  }));
});
// endregion

// region Preload Config
// --------------------------------------------------------------------------------------------------------------
export class WuwaVoAppPreloadConfig extends VoAppPreloadConfig {

  // region General Preload Info
  // ------------------------------------------------------------------------------------------------------------
  override getTemplateName(input: VoAppPreloadInput): string {
    if (input.isMainCharacter) {
      if (input.isCombat) {
        return 'Combat VO';
      } else {
        return 'VO';
      }
    } else {
      if (input.isCombat) {
        return 'Combat VO';
      } else {
        return 'VO';
      }
    }
  }
  // endregion

  // region Story Preload Config
  // ------------------------------------------------------------------------------------------------------------
  override getStoryFileName(input: VoAppPreloadInput): string {
    let prefix = '{character}{language} ';

    let title = input.voiceOver.TitleTextMap.EN;
    title = title.replace(/:/g, '');
    title = title.replace(input.avatarName.EN, '{character}');

    if (title === `{character}'s Hobby`) {
      title = 'Hobby';
    }
    if (title === `{character}'s Trouble`) {
      title = 'Trouble';
    }
    return prefix + title + '.ogg';
  }

  override getStoryGroupName(input: VoAppPreloadInput): string {
    const { voiceOver, storyContext } = input;
    let titleEN = voiceOver.TitleTextMap.EN.toLowerCase();

    if (titleEN.startsWith('thoughts')) {
      return 'Thoughts';
    } else if (titleEN.includes('hobby') || titleEN.includes('trouble') || titleEN.includes('food') || titleEN.includes('ideals')) {
      return 'Miscellaneous';
    } else if (titleEN.startsWith('chat:')) {
      return 'Chat';
    } else if (titleEN.startsWith('about')) {
      return 'About Others';
    } else if (titleEN.startsWith('birthday')) {
      return 'Birthday';
    } else if (titleEN.startsWith('idle:')) {
      return 'Idles';
    } else if (titleEN.startsWith('self-introduction') || titleEN.startsWith('greeting')) {
      return 'Greetings';
    } else if (titleEN.startsWith('join team')) {
      return 'Join Team';
    } else if (titleEN.startsWith('ascension:')) {
      return 'Ascension';
    } else {
      return 'Unknown'
    }
  }

  override runStoryExtraHook(input: VoAppPreloadInput) {
    const out: SbOut = input.out;
    const voiceOver: CommonVoiceOver<FavorWord> = input.voiceOver;

    const favorWord = voiceOver.Original;
    if (favorWord.CondSummary.Intimacy) {
      out.prop('intimacy', favorWord.CondSummary.Intimacy);
    }
    if (favorWord.CondSummary.Ascension) {
      out.prop('ascension', favorWord.CondSummary.Ascension);
    }
  }
  // endregion

  // region Combat Preload Config
  // ------------------------------------------------------------------------------------------------------------
  getCombatGroupCode(input: VoAppPreloadInput): string {
    let titleEN: string = input.voiceOver.TitleTextMap.EN.toLowerCase();
    if (titleEN.startsWith('normal attack')) {
      return 'normal';
    } else if (titleEN.startsWith('heavy attack: burst')) {
      return 'heavy-burst';
    } else if (titleEN.startsWith('heavy attack')) {
      return 'heavy';
    } else if (titleEN.startsWith('aerial')) {
      return 'aerial';
    } else if (titleEN.startsWith('resonance skill')) {
      return 'resskill';
    } else if (titleEN.startsWith('enhancedresonance skill')) {
      return 'enhancedresskill';
    } else if (titleEN.startsWith('forte')) {
      return 'forte';
    } else if (titleEN.startsWith('resonance liberation')) {
      return 'resliberation';
    } else if (titleEN.startsWith('enhanced resonance liberation')) {
      return 'enhancedresliberation';
    } else if (titleEN.startsWith('strategic parry')) {
      return 'stratparry';
    } else if (titleEN.startsWith('counterattack')) {
      return 'counter';
    } else if (titleEN.startsWith('dodge counter')) {
      return 'dodgecounter';
    } else if (titleEN.startsWith('hit')) {
      return 'hit';
    } else if (titleEN.startsWith('injured')) {
      return 'injured';
    } else if (titleEN.startsWith('fallen')) {
      return 'fallen';
    } else if (titleEN.startsWith('echo summon')) {
      return 'esummon';
    } else if (titleEN.startsWith('echo transform')) {
      return 'etransform';
    } else if (titleEN.includes('intro') && titleEN.includes('outro')) {
      if (titleEN.includes('liberation')) {
        return 'liberationintrooutro';
      } else {
        return 'introoutro';
      }
    } else if (titleEN.startsWith('enemies near')) {
      return 'enemynear';
    } else if (titleEN.startsWith('glider')) {
      return 'glider';
    } else if (titleEN.startsWith('grapple')) {
      return 'grapple';
    } else if (titleEN.startsWith('sensor')) {
      return 'sensor';
    } else if (titleEN.startsWith('dash')) {
      return 'dash';
    } else if (titleEN.startsWith('wall dash')) {
      return 'walldash';
    } else if (titleEN.startsWith('supply chest')) {
      return 'chest';
    } else if (titleEN.startsWith('lose control')) {
      return 'losecontrol';
    } else {
      console.log('[VO-App] Was unable to determine combat group for voice-over', input.voiceOver);
      return 'unknown';
    }
  }

  override getCombatGroupCodes(input: VoAppPreloadInput): Map<string, VoAppPreloadCombatGroupCodeConf> {
    const combatGroupCodes = new Map<string, VoAppPreloadCombatGroupCodeConf>();

    combatGroupCodes.set('losecontrol', { groupTitle: 'Lose Control', animEvtFileMatch: null });

    combatGroupCodes.set('normal', { groupTitle: 'Normal Attack', animEvtFileMatch: null });
    combatGroupCodes.set('heavy', { groupTitle: 'Heavy Attack', animEvtFileMatch: null });
    combatGroupCodes.set('heavy-burst', { groupTitle: 'Heavy Attack Burst', animEvtFileMatch: null });
    combatGroupCodes.set('aerial', { groupTitle: 'Aerial Attack', animEvtFileMatch: null });

    combatGroupCodes.set('resskill', { groupTitle: 'Resonance Skill', animEvtFileMatch: null });
    combatGroupCodes.set('enhancedresskill', { groupTitle: 'Enhanced Resonance Skill', animEvtFileMatch: null });
    combatGroupCodes.set('forte', { groupTitle: 'Forte', animEvtFileMatch: null });
    combatGroupCodes.set('resliberation', { groupTitle: 'Resonance Liberation', animEvtFileMatch: null });
    combatGroupCodes.set('liberationintrooutro', { groupTitle: 'Liberation Intro & Outro', animEvtFileMatch: null });
    combatGroupCodes.set('enhancedresliberation', { groupTitle: 'Enhanced Resonance Liberation', animEvtFileMatch: null });
    combatGroupCodes.set('stratparry', { groupTitle: 'Strategic Parry', animEvtFileMatch: null });
    combatGroupCodes.set('counter', { groupTitle: 'Counterattack', animEvtFileMatch: null });
    combatGroupCodes.set('dodgecounter', { groupTitle: 'Dodge Counter', animEvtFileMatch: null });

    combatGroupCodes.set('hit', { groupTitle: 'Hit', animEvtFileMatch: null });
    combatGroupCodes.set('injured', { groupTitle: 'Injured', animEvtFileMatch: null });
    combatGroupCodes.set('fallen', { groupTitle: 'Fallen', animEvtFileMatch: null });

    combatGroupCodes.set('esummon', { groupTitle: 'Echo Summon', animEvtFileMatch: null });
    combatGroupCodes.set('etransform', { groupTitle: 'Echo Transform', animEvtFileMatch: null });

    combatGroupCodes.set('introoutro', { groupTitle: 'Concerto Skills', animEvtFileMatch: null });
    combatGroupCodes.set('enemynear', { groupTitle: 'Enemies Near', animEvtFileMatch: null });

    combatGroupCodes.set('glider', { groupTitle: 'Glider', animEvtFileMatch: null });
    combatGroupCodes.set('grapple', { groupTitle: 'Grapple', animEvtFileMatch: null });
    combatGroupCodes.set('sensor', { groupTitle: 'Sensor', animEvtFileMatch: null });

    combatGroupCodes.set('dash', { groupTitle: 'Dash', animEvtFileMatch: null });
    combatGroupCodes.set('walldash', { groupTitle: 'Wall Dash', animEvtFileMatch: null });

    combatGroupCodes.set('chest', { groupTitle: 'Chest', animEvtFileMatch: null });

    return combatGroupCodes;
  }
  // endregion
}
// endregion
