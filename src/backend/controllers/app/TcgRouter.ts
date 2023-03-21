import { create, Request, Response, Router } from '../../util/router';
import { getControl } from '../../scripts/script_util';
import { getGCGControl } from '../../scripts/gcg/gcg_control';
import { generateGCGTutorialDialogue } from '../../scripts/gcg/gcg_tutorial_text';
import {
  GCG_TAGS_WITHOUT_ICONS,
  GCGCardExcelConfigData,
  GCGCommonCard,
  GCGGameExcelConfigData,
} from '../../../shared/types/gcg-types';
import { defaultMap } from '../../../shared/util/genericUtil';
import { isInt, toInt } from '../../../shared/util/numberUtil';
import { sort } from '../../../shared/util/arrayUtil';
import { queryTab } from '../../middleware/queryTab';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/TCG/talk-detail', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    res.render('pages/gcg/gcg-talk-detail', {
      title: 'TCG Talk Detail',
      talkSections: await getGCGControl(ctrl).generateGCGTalkDialogueSections(),
      bodyClass: ['page--tcg-talk-detail']
    });
  });

  router.get('/TCG/tutorial-text', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    res.render('pages/gcg/gcg-tutorial-text', {
      title: 'TCG Tutorial Text',
      dialogue: await generateGCGTutorialDialogue(ctrl),
      bodyClass: ['page--tcg-tutorial-text']
    });
  });

  router.get('/TCG/stages', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const gcg = getGCGControl(ctrl);

    const stages = await gcg.selectAllStage();

    const stagesByGroupAndType: {[group: string]: {[type: string]: GCGGameExcelConfigData[]}} =
      defaultMap(() => defaultMap('Array'));

    for (let stage of stages) {
      stagesByGroupAndType[stage.WikiGroup][stage.WikiType].push(stage);
    }

    res.render('pages/gcg/gcg-stage-list', {
      title: 'TCG Stages',
      stagesByGroupAndType,
      bodyClass: ['page--tcg-stage']
    });
  });

  router.get('/TCG/stages/:stageId', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const gcg = getGCGControl(ctrl);
    const stageId = isInt(req.params.stageId) ? toInt(req.params.stageId) : null;
    const stage = await gcg.selectStage(stageId);

    const stageForJson: GCGGameExcelConfigData = Object.assign({}, stage);
    if (stageForJson.EnemyCardGroup) {
      stageForJson.EnemyCardGroup = Object.assign({}, stageForJson.EnemyCardGroup);
      delete stageForJson.EnemyCardGroup.MappedCardList;
      delete stageForJson.EnemyCardGroup.MappedCharacterList;
      delete stageForJson.EnemyCardGroup.MappedWaitingCharacterList;
    }
    if (stageForJson.CardGroup) {
      stageForJson.CardGroup = Object.assign({}, stageForJson.CardGroup);
      delete stageForJson.CardGroup.MappedCardList;
      delete stageForJson.CardGroup.MappedCharacterList;
      delete stageForJson.CardGroup.MappedWaitingCharacterList;
    }
    if (stageForJson.LevelTalk) {
      stageForJson.LevelTalk = Object.assign({}, stageForJson.LevelTalk);
      for (let [key, value] of Object.entries(stageForJson.LevelTalk)) {
        if (key.endsWith('Talk')) {
          stageForJson.LevelTalk[key] = Object.assign({}, value);
          delete stageForJson.LevelTalk[key]['Avatar'];
        }
      }
    }

    res.render('pages/gcg/gcg-stage', {
      title: (stage?.WikiCombinedTitle || 'Not Found') + ' | TCG Stage',
      stage,
      stageForJson,
      bodyClass: ['page--tcg-stage'],
      tab: queryTab(req, 'display', 'wikitext', 'json'),
    });
  });


  router.get('/TCG/cards', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const gcg = getGCGControl(ctrl);

    const charCards = await gcg.selectAllChar();
    const actionCards = await gcg.selectAllCard();

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

    res.render('pages/gcg/gcg-card-list', {
      title: 'Cards',
      bodyClass: ['page--tcg-card'],
      charCardsBySection,
      actionCardsBySection,
      GCG_TAGS_WITHOUT_ICONS
    });
  });

  router.get('/TCG/cards/:cardId', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const gcg = getGCGControl(ctrl);
    const cardId = isInt(req.params.cardId) ? toInt(req.params.cardId) : null;
    const card: GCGCommonCard = (await gcg.selectChar(cardId)) || (await gcg.selectCard(cardId));

    res.render('pages/gcg/gcg-card', {
      title: (card?.WikiName || 'Not Found') + ' | TCG Card',
      bodyClass: ['page--tcg-card'],
      card: card,
      tab: queryTab(req, 'display', 'wikitext', 'json'),
      GCG_TAGS_WITHOUT_ICONS
    });
  });

  router.get('/TCG/rules', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const gcg = getGCGControl(ctrl);
    const rules = await gcg.selectAllRuleText();

    res.render('pages/gcg/gcg-rules', {
      title: 'TCG Rules',
      bodyClass: ['page--tcg-rules'],
      rules
    });
  });

  return router;
}