import { GCGControl } from './gcg_control';
import {
  GCGCharExcelConfigData,
  GCGCommonCard,
  GCGGameExcelConfigData, GCGSkillExcelConfigData, isActionCard, isCharacterCard,
} from '../../../../shared/types/genshin/gcg-types';
import { SbOut } from '../../../../shared/util/stringUtil';
import { GenshinControl } from '../genshinControl';
import { ol_gen_from_id } from '../../generic/basic/OLgen';

// Cards
// --------------------------------------------------------------------------------------------------------------

export async function generateCardList(control: GCGControl): Promise<string> {
  return 'Lorem ipsum';
}

export async function generateSkillPage(gcg: GCGControl, parentCard: GCGCommonCard, skill: GCGSkillExcelConfigData, index: number): Promise<string> {
  const sb = new SbOut();

  sb.line(`{{Genius Invokation TCG Skill Infobox`);
  sb.setPropPad(11);
  sb.prop('id', skill.Id);
  sb.prop('image', `${skill.WikiName} ${parentCard.WikiType} Skill.png`, true);
  sb.prop('type', skill.WikiType);
  sb.prop('character', parentCard.WikiName);
  sb.prop('element', parentCard.WikiElement);

  for (let cost of skill.CostList) {
    if (cost.CostType === 'GCG_COST_ENERGY') {
      sb.prop('energy', cost.Count);
    } else if (cost.CostType === 'GCG_COST_DICE_SAME') {
      sb.prop('matching', cost.Count);
    } else if (cost.CostType === 'GCG_COST_DICE_VOID') {
      sb.prop('unaligned', cost.Count);
    }
  }

  sb.prop('effect', skill.WikiDesc);
  sb.prop('order', index + 1);
  sb.line('}}');
  sb.line(`'''${skill.WikiName}''' is a [[${parentCard.WikiType} ${skill.WikiType}|${skill.WikiType}]] ` +
    `for [[${parentCard.WikiName} (${parentCard.WikiType})|${parentCard.WikiName}]] in [[Genius Invokation TCG]].`);
  sb.line();

  sb.line('==Other Languages==');
  sb.line((await ol_gen_from_id(gcg.ctrl, skill.NameTextMapHash))?.result);
  sb.line();
  sb.line('==Change History==');
  sb.line('{{Change History|<!-- version -->}}');
  sb.line();
  sb.line('==Navigation==');
  sb.line(`{{Genius Invokation TCG Skill Infobox|${parentCard.WikiName}}}`);
  sb.line();

  return sb.toString();
}

export async function generateCardPage(gcg: GCGControl, card: GCGCommonCard): Promise<string> {
  if (!card) {
    return '';
  }

  const sb = new SbOut();

  sb.line(`{{Genius Invokation TCG Infobox`);
  sb.setPropPad(12);

  const cardFace = card.CardFace;
  const deckCard = card.DeckCard;

  sb.prop('id', card.Id);
  sb.prop('title', card.WikiName);
  sb.prop('image', `${card.WikiName} ${card.WikiType}.png`, true);
  sb.prop('type', card.WikiType);
  if (isActionCard(card)) {
    sb.prop('group', card.MappedTagList.filter(x => !!x.Type).map(x => x.NameText).join(';'));
  }
  if (deckCard?.RelatedCharacter) {
    sb.prop('character', deckCard?.RelatedCharacter.NameText);
  }
  if (isCharacterCard(card)) {
    sb.prop('health', card.Hp);
    sb.prop('element', card.WikiElement);
    sb.prop('faction', card.WikiFaction);
    sb.prop('weapon', card.WikiWeapon);
    if (card.WikiDesc) {
      sb.prop('description', card.WikiDesc);
    }
  }
  if (isActionCard(card)) {
    if (card.CardType === 'GCG_CARD_SUMMON') {
      sb.prop('summontype');
      sb.prop('createdby');
    }

    for (let cost of card.CostList) {
      if (cost.CostType === 'GCG_COST_ENERGY') {
        sb.prop('energy', cost.Count);
      } else if (cost.CostType === 'GCG_COST_DICE_SAME') {
        sb.prop('matching', cost.Count);
      } else if (cost.CostType === 'GCG_COST_DICE_VOID') {
        sb.prop('unaligned', cost.Count);
      }
    }

    sb.prop('effect', card.WikiDesc);

    const usageRegex = /\$\[K3]\s*:\s*([\-+]?\d+[\-+]?)/;
    if (card.DescText && usageRegex.test(card.DescText)) {
      sb.prop('usage', usageRegex.exec(card.DescText)[1]);
    }
  }
  sb.prop('source1', deckCard?.SourceText || '');
  if (isCharacterCard(card) && card.MappedTagList.some(tag => tag.Type.startsWith('GCG_TAG_NATION'))) {
    sb.prop('features', card.WikiName);
  }
  sb.line('}}');

  // Intro
  let preType = '';
  for (let tag of card.MappedTagList.filter(x => !!x.Type)) {
    if (tag.Type === 'GCG_TAG_TALENT') {
      preType += `[[Talent Card|Talent]] `;
    } else if (tag.Type === 'GCG_TAG_SLOWLY') {
      preType += `[[Talent Combat Action Card|Combat Action]] `;
    } else if (tag.Type === 'GCG_TAG_FOOD') {
      preType += `[[Food Card|Food]] `;
    } else if (tag.Type === 'GCG_TAG_PLACE') {
      preType += `[[Location Card|Location]] `;
    } else if (tag.Type === 'GCG_TAG_ALLY') {
      preType += `[[Companion Card|Companion]] `;
    } else if (tag.Type === 'GCG_TAG_ITEM') {
      preType += `[[Item Card|Item]] `;
    } else if (tag.Type === 'GCG_TAG_RESONANCE') {
      preType += `[[Elemental Resonance Card|Elemental Resonance]] `;
    }
  }

  const wta: string = /^[aeiou]/i.test(preType || card.WikiType) ? 'an' : 'a'; // WTA: Wiki Type (Indefinite) Article

  if (isCharacterCard(card)) {
    if (card.IsCanObtain) {
      sb.line(`'''${card.WikiName}''' is ${wta} ${preType}[[${card.WikiType}]] obtained in [[Genius Invokation TCG]].`);
    } else {
      sb.line(`'''${card.WikiName}''' is an unobtainable ${preType}[[${card.WikiType}]] in [[Genius Invokation TCG]].`);
    }
  } else {
    let addendum = '';
    if (deckCard?.RelatedCharacter) {
      const relatedCharName = deckCard?.RelatedCharacter?.NameText;
      addendum += ` for [[${relatedCharName} (Character Card)|${relatedCharName}]]`;
    }
    sb.line(`'''${card.WikiName}''' is ${wta} ${preType}[[${card.WikiType}]]${addendum} in [[Genius Invokation TCG]].`);
  }
  sb.line();

  if (isCharacterCard(card)) {
    sb.line('==Skills==');
    sb.line('{{Genius Invokation TCG Skills Table}}');
    sb.line();
    sb.line('==Talent Cards==');
    sb.line('{{Genius Invokation TCG Talent Cards Table}}');
    sb.line();
  }
  if (deckCard && deckCard.ProficiencyReward && deckCard.ProficiencyReward.ProficiencyRewardList.length) {
    sb.line('==Proficiency Reward==');
    for (let prof of deckCard.ProficiencyReward.ProficiencyRewardList) {
      const cardFaceItem = prof?.Reward?.RewardItemList
        ?.find(item => item.Material.MaterialType === 'MATERIAL_GCG_CARD_FACE')?.Material;
      if (cardFaceItem) {
        const golden: boolean = cardFaceItem.Icon?.toLowerCase()?.includes('gold') || false;
        sb.line(`After reaching Proficiency ${prof.Proficiency}, the following Dynamic Skin is obtained:<br />` +
          `{{TCG Card|${cardFaceItem.NameText}|1${golden ? '|golden=1' : ''}|caption=1}}`);
        sb.line();
      }
    }
  }
  if (deckCard && (deckCard.StoryTitleText || deckCard.StoryContextText)) {
    sb.line('==Story==');
    sb.line(`{{Description|${await gcg.normGcgText(deckCard.StoryContextText)}|title=${await gcg.normGcgText(deckCard.StoryTitleText)}}}`);
    sb.line();
  }
  sb.line('==Stage Appearances==');
  sb.line('{{Genius Invokation TCG Stage Appearances}}');
  sb.line();
  if (isCharacterCard(card) && card.CardFace) {
    sb.line('==Gallery==');
    sb.line('<gallery>');
    sb.line(`${card.WikiName} TCG Avatar Icon.png|Avatar Icon`)
    sb.line('</gallery>');
    sb.line();
    sb.line('==Animations==');
    sb.line('{{Preview');
    sb.setPropPad(9)
    sb.prop('size', '200px');
    sb.prop('file1', `${card.WikiName} Dynamic Skin`);
    sb.prop('caption', 'Dynamic Skin Idle Animation');
    sb.line('}}');
    sb.line();
  }
  sb.line('==Other Languages==');
  if (isCharacterCard(card)) {
    sb.line(`{{Other Languages|Transclude=${card.WikiName}}}`);
  } else {
    sb.line((await ol_gen_from_id(gcg.ctrl, card.NameTextMapHash)).result);
  }
  sb.line();
  sb.line('==Change History==');
  sb.line('{{Change History|<!-- version -->}}');
  sb.line();
  sb.line('==Navigation==');
  if (isCharacterCard(card)) {
    sb.line(`{{Genius Invokation TCG Navbox|${card.WikiType} ${card.IsCanObtain ? 'Obtainable' : 'Unobtainable'}}}`);
  } else {
    sb.line(`{{Genius Invokation TCG Navbox|${card.WikiType}}}`);
  }
  sb.line();

  return sb.toString();
}

// Stages
// --------------------------------------------------------------------------------------------------------------

export async function generateStageList(control: GCGControl): Promise<string> {
  return 'Lorem ipsum';
}

export async function generateStagePage(stage: GCGGameExcelConfigData): Promise<string> {
  return 'Lorem ipsum';
}