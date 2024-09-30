import { create } from '../../../routing/router.ts';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import { getGCGControl } from '../../../domain/genshin/gcg/gcg_control.ts';
import { generateGCGTutorialDialogue } from '../../../domain/genshin/gcg/gcg_tutorial_text.ts';
import {
  GCG_TAGS_WITHOUT_ICONS,
  GCGCardExcelConfigData,
  GCGCommonCard,
  GCGGameExcelConfigData,
} from '../../../../shared/types/genshin/gcg-types.ts';
import { defaultMap, removeCyclicRefs } from '../../../../shared/util/genericUtil.ts';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { sort } from '../../../../shared/util/arrayUtil.ts';
import { queryTab } from '../../../middleware/util/queryTab.ts';
import { generateCardPage, generateSkillPage, generateStageTemplate } from '../../../domain/genshin/gcg/gcg_wikitext.ts';
import { Request, Response, Router } from 'express';
import { ApiCyclicValueReplacer } from '../../../middleware/api/apiCyclicValueReplacer.ts';
import GcgStageListPage from '../../../components/genshin/gcg/GcgStageListPage.vue';
import GcgStageSearchPage from '../../../components/genshin/gcg/GcgStageSearchPage.vue';
import { ImageIndexEntity } from '../../../../shared/types/image-index-types.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/TCG/tutorial-text', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    res.render('pages/genshin/gcg/gcg-tutorial-text', {
      title: 'TCG Tutorial Text',
      dialogue: await generateGCGTutorialDialogue(ctrl),
      bodyClass: ['page--tcg-tutorial-text']
    });
  });

  // region Stages
  // --------------------------------------------------------------------------------------------------------------

  router.get('/TCG/stages', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const gcg = getGCGControl(ctrl);

    console.time('[TCG] stages select');
    const stages = await gcg.selectAllStage();
    console.timeEnd('[TCG] stages select');

    const stagesByGroupAndType: {[group: string]: {[type: string]: GCGGameExcelConfigData[]}} =
      defaultMap(() => defaultMap('Array'));

    for (let stage of stages) {
      stagesByGroupAndType[stage.WikiGroup || 'No Group'][stage.WikiType || 'No Type'].push(stage);
    }

    res.render(GcgStageListPage, {
      title: 'TCG Stages',
      stagesByGroupAndType,
      bodyClass: ['page--tcg-stage']
    });
  });

  router.get('/TCG/stages/search', async (req: Request, res: Response) => {
    res.render(GcgStageSearchPage, {
      title: 'TCG Stage Search',
      bodyClass: ['page--tcg-stage']
    });
  });

  router.get('/TCG/stages/:stageId', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const gcg = getGCGControl(ctrl);
    const stageId = isInt(req.params.stageId) ? toInt(req.params.stageId) : null;
    const stage = await gcg.selectStage(stageId);

    res.render('pages/genshin/gcg/gcg-stage', {
      title: (stage?.WikiCombinedTitle || 'Not Found') + ' | TCG Stage',
      stage,
      stageForJsonUnmapped: removeCyclicRefs(gcg.getStageForJson(stage, true), ApiCyclicValueReplacer, false),
      wikitext: await generateStageTemplate(gcg, stage),
      dialogueWikitext: stage.StageTalk ? stage.StageTalk.toString(true) : null,
      idleWikitext: stage.IdleTalk ? stage.IdleTalk.toString(true) : null,
      bodyClass: ['page--tcg-stage'],
      tab: queryTab(req, 'display', 'wikitext', 'json'),
    });
  });
  // endregion

  // region Cards
  // --------------------------------------------------------------------------------------------------------------

  router.get('/TCG/cards', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const gcg = getGCGControl(ctrl);
    gcg.disableSkillSelect = true;
    gcg.disableNpcLoad = true;
    gcg.disableRelatedCharacterLoad = true;
    gcg.disableVoiceItemsLoad = true;
    await gcg.init();

    const [charCards, actionCards] = await Promise.all([
      gcg.selectAllCharacterCards(),
      gcg.selectAllActionCards(),
    ]);

    sort(charCards, '-IsCanObtain', 'Id');
    sort(actionCards, 'IsHidden', '-IsCanObtain', 'Id');

    const charCardsBySection: { Obtainable: GCGCardExcelConfigData[], Unobtainable: [] } = defaultMap('Array');
    for (let charCard of charCards) {
      let obtainableProp = charCard.IsCanObtain ? 'Obtainable' : 'Unobtainable';
      charCardsBySection[obtainableProp].push(charCard);
    }

    const actionCardsBySection: {[sectionName: string]: { Obtainable: GCGCardExcelConfigData[], Unobtainable: [] }} = defaultMap('Array', {
      'Equipment Cards': defaultMap('Array'),
      'Support Cards': defaultMap('Array'),
      'Event Cards': defaultMap('Array'),
      'Other Cards': defaultMap('Array'),
    });
    for (let actionCard of actionCards) {
      let obtainableProp = actionCard.IsCanObtain ? 'Obtainable' : 'Unobtainable';
      if (actionCard.IsEquipment) {
        actionCardsBySection['Equipment Cards'][obtainableProp].push(actionCard);
      } else if (actionCard.IsSupport) {
        actionCardsBySection['Support Cards'][obtainableProp].push(actionCard);
      } else if (actionCard.IsEvent) {
        actionCardsBySection['Event Cards'][obtainableProp].push(actionCard);
      } else {
        actionCardsBySection['Other Cards'][obtainableProp].push(actionCard);
      }
    }

    res.render('pages/genshin/gcg/gcg-card-list', {
      title: 'Cards',
      bodyClass: ['page--tcg-card'],
      charCardsBySection,
      actionCardsBySection,
      GCG_TAGS_WITHOUT_ICONS
    });
  });

  router.get('/TCG/cards/:cardId', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const gcg = getGCGControl(ctrl);
    const cardId = isInt(req.params.cardId) ? toInt(req.params.cardId) : null;
    const card: GCGCommonCard = (await gcg.selectCharacterCard(cardId)) || (await gcg.selectActionCard(cardId));

    const WikiImageEntity: ImageIndexEntity = card.WikiImage ? await ctrl.selectImageIndexEntity(card.WikiImage) : null;
    const WikiGoldenImageEntity: ImageIndexEntity = card.WikiImage ? await ctrl.selectImageIndexEntity(card.WikiGoldenImage) : null;

    res.render('pages/genshin/gcg/gcg-card', {
      title: (card?.WikiName || 'Not Found') + ' | TCG Card',
      bodyClass: ['page--tcg-card'],
      card: card,
      wikitext: await generateCardPage(gcg, card),
      skills: await (card?.MappedSkillList || []).asyncMap(async (skill, index) => ({
        skill: skill,
        wikitext: await generateSkillPage(gcg, card, skill, index),
        index,
      })),
      tab: queryTab(req, 'display', 'wikitext', 'json'),
      voiceItemsWikitext: card.VoiceItems && card.VoiceItems.length ? card.VoiceItems.map(vo => `{{A|${vo.fileName}}}`).join('\n') : '',
      GCG_TAGS_WITHOUT_ICONS,
      WikiImageEntity,
      WikiGoldenImageEntity
    });
  });
  // endregion

  // region Rules
  // --------------------------------------------------------------------------------------------------------------

  router.get('/TCG/rules', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const gcg = getGCGControl(ctrl);
    const rules = await gcg.selectAllRuleText();

    res.render('pages/genshin/gcg/gcg-rules', {
      title: 'TCG Rules',
      bodyClass: ['page--tcg-rules'],
      rules
    });
  });
  // endregion

  return router;
}
