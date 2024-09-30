import { create } from '../../../routing/router.ts';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import { BookSuitExcelConfigData, Readable } from '../../../../shared/types/genshin/readable-types.ts';
import { ol_combine_results, ol_gen_from_id, OLResult } from '../../../domain/abstract/basic/OLgen.ts';
import {
  getCityIdsWithViewpoints,
  selectViewpoints, VIEWPOINT_DEFAULT_FILE_FORMAT_IMAGE, VIEWPOINT_DEFAULT_FILE_FORMAT_MAP,
  VIEWPOINT_FILE_FORMAT_PARAMS,

} from '../../../domain/genshin/archive/viewpoints.ts';
import {
  selectTutorials,
  TUTORIAL_FILE_FORMAT_PARAMS,
  TUTORIAL_DEFAULT_FILE_FORMAT_IMAGE,
  pushTipCodexTypeName,
} from '../../../domain/genshin/archive/tutorials.ts';
import { PushTipsCodexType, PushTipsCodexTypeList, TutorialsByType } from '../../../../shared/types/genshin/tutorial-types.ts';
import { ViewpointsByRegion } from '../../../../shared/types/genshin/viewpoint-types.ts';
import { AchievementsByGoals } from '../../../../shared/types/genshin/achievement-types.ts';
import {
  generateLoadingTipsWikiText,
  selectLoadingMainCatNames,
  selectLoadingTips,
} from '../../../domain/genshin/archive/loadingTips.ts';
import { LoadingCat } from '../../../../shared/types/genshin/loading-types.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { paramCmp, SbOut, sentenceJoin, toParam } from '../../../../shared/util/stringUtil.ts';
import { Request, Response, Router } from 'express';
import { defaultMap, toBoolean } from '../../../../shared/util/genericUtil.ts';
import AchievementPage from '../../../components/genshin/achievements/AchievementPage.vue';
import FurnishingSetListingPage from '../../../components/genshin/furnishings/FurnishingSetListingPage.vue';
import {
  FurnitureSuiteTree, HomeWorldEventExcelConfigData, HomeWorldNPCExcelConfigData,
} from '../../../../shared/types/genshin/homeworld-types.ts';
import FurnishingSetSinglePage from '../../../components/genshin/furnishings/FurnishingSetSinglePage.vue';
import {
  TalkConfigAccumulator,
  talkConfigGenerate,
} from '../../../domain/genshin/dialogue/dialogue_util.ts';
import { ManualTextMapHashes } from '../../../../shared/types/genshin/manual-text-map.ts';
import { MetaProp } from '../../../util/metaProp.ts';
import { DialogueSectionResult } from '../../../util/dialogueSectionResult.ts';
import AchievementListingPage from '../../../components/genshin/achievements/AchievementListingPage.vue';
import AchievementSearchPage from '../../../components/genshin/achievements/AchievementSearchPage.vue';
import TutorialSearchPage from '../../../components/genshin/tutorials/TutorialSearchPage.vue';
import TutorialCategoriesPage from '../../../components/genshin/tutorials/TutorialCategoriesPage.vue';
import GenshinViewpointsPage from '../../../components/genshin/viewpoints/GenshinViewpointsPage.vue';
import { ImageIndexEntity } from '../../../../shared/types/image-index-types.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  // region Material Items
  // --------------------------------------------------------------------------------------------------------------
  router.get('/items', async (req: Request, res: Response) => {
    res.render('pages/genshin/archive/material-search', {
      title: 'Items',
      bodyClass: ['page--items'],
    });
  });

  router.get('/items/:itemId', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);

    if (req.params.itemId) {
      const material = await ctrl.selectMaterialExcelConfigData(toInt(req.params.itemId), {
        LoadRelations: true,
        LoadSourceData: true,
        LoadItemUse: true,
        LoadCodex: true,
      });

      let readable = await ctrl.selectReadable(material.Id);
      if (!readable || !readable.Material || readable.Material.Id !== material.Id) {
        readable = null;
      }

      res.render('pages/genshin/archive/material-item', {
        title: material ? material.NameText : 'Item not found',
        bodyClass: ['page--items'],
        material,
        readable,
        ol: material ? (await ol_gen_from_id(ctrl, material.NameTextMapHash)) : null
      });
    } else {
      res.render('pages/genshin/archive/material-item', {
        title: 'Item not found',
        bodyClass: ['page--materials'],
      });
    }
  });
  // endregion

  // region Weapons
  // --------------------------------------------------------------------------------------------------------------
  router.get('/weapons', async (req: Request, res: Response) => {
    res.render('pages/genshin/archive/weapon-search', {
      title: 'Weapons',
      bodyClass: ['page--weapons'],
    });
  });

  router.get('/weapons/:weaponId', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);

    const weapon = await ctrl.selectWeaponById(toInt(req.params.weaponId), {
      LoadRelations: true,
      LoadReadable: true,
      LoadEquipAffix: true
    });

    if (weapon) {
      const weaponOl: OLResult = await ol_gen_from_id(ctrl, weapon.NameTextMapHash);
      const passiveOl: OLResult = weapon?.EquipAffixList?.[0]?.NameTextMapHash
        ? (await ol_gen_from_id(ctrl, weapon.EquipAffixList[0].NameTextMapHash)) : null;

      const iconEntity: ImageIndexEntity = await ctrl.selectImageIndexEntity(weapon.Icon);
      const awakenIconEntity: ImageIndexEntity = weapon.AwakenIcon ? await ctrl.selectImageIndexEntity(weapon.AwakenIcon) : null;

      res.render('pages/genshin/archive/weapon-item', {
        title: weapon.NameText,
        bodyClass: ['page--weapons'],
        weapon,
        iconEntity,
        awakenIconEntity,
        ol: ol_combine_results([weaponOl, passiveOl])
      });
    } else {
      res.render('pages/genshin/archive/weapon-item', {
        title: 'Weapon not found',
        bodyClass: ['page--weapons'],
      });
    }
  });
  // endregion

  // region Viewpoints
  // --------------------------------------------------------------------------------------------------------------
  router.get('/viewpoints/:city?', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    let cityName: string = '';
    let viewpointsList: ViewpointsByRegion = null;

    if (req.params.city) {
      let cityId = await ctrl.getCityIdFromName(req.params.city);
      if (cityId) {
        cityName = await ctrl.selectCityNameById(cityId);
        viewpointsList = await selectViewpoints(ctrl, cityId);
      }
    }

    const cityIdsWithViewpoints = await getCityIdsWithViewpoints(ctrl);
    const cities = await ctrl.selectAllCities(city => cityIdsWithViewpoints.has(city.CityId));

    res.render(GenshinViewpointsPage, {
      title: `${cityName} Viewpoints`.trim(),
      bodyClass: ['page--viewpoints'],
      citySelected: req.params.city,
      cities,
      viewpointsList,
      fileFormatParams: VIEWPOINT_FILE_FORMAT_PARAMS.join(','),
      fileFormatDefault_image: VIEWPOINT_DEFAULT_FILE_FORMAT_IMAGE,
      fileFormatDefault_map: VIEWPOINT_DEFAULT_FILE_FORMAT_MAP,
    });
  });
  // endregion

  // region Tutorials
  // --------------------------------------------------------------------------------------------------------------
  router.get('/tutorials/search', async (req: Request, res: Response) => {
    res.render(TutorialSearchPage, {
      title: 'Tutorials',
      bodyClass: ['page--tutorials', 'page--tutorials-search'],
    });
  });

  router.get('/tutorials/:category?', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const codexTypes: PushTipsCodexType[] = PushTipsCodexTypeList;
    let codexTypeName: string = null;
    let tutorialsByType: TutorialsByType = null;

    if (req.params.category) {
      let codexType = codexTypes.find(codexType => paramCmp(pushTipCodexTypeName(codexType), req.params.category));
      if (codexType) {
        codexTypeName = pushTipCodexTypeName(codexType);
        tutorialsByType = await selectTutorials(ctrl, codexType);
      }
    }

    res.render(TutorialCategoriesPage, {
      title: codexTypeName ? `Tutorials - ${codexTypeName}` : 'Tutorials',
      bodyClass: ['page--tutorials', 'page--tutorials-categories'],
      categorySelected: req.params.category,
      categoryNames: codexTypes.map(pushTipCodexTypeName),
      tutorialsByType,
      fileFormatParams: TUTORIAL_FILE_FORMAT_PARAMS.join(','),
      fileFormatDefault_image: TUTORIAL_DEFAULT_FILE_FORMAT_IMAGE,
    });
  });
  // endregion

  // region Achievements
  // --------------------------------------------------------------------------------------------------------------

  router.get('/achievements/search', async (req: Request, res: Response) => {
    res.render(AchievementSearchPage, {
      title: 'Achievements',
      bodyClass: ['page--achievements', 'page--achievements-search'],
    });
  });

  router.get('/achievements/:id(\\d+)/', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const achievement = await ctrl.selectAchievement(toInt(req.params.id));

    const sb = new SbOut();
    if (achievement) {
      const achievements = Object.values(await ctrl.selectAchievements(achievement.GoalId))[0].Achievements;
      const achievementsWithSameName = achievements
        .filter(a => a.TitleText === achievement.TitleText); // should include self

      let achieveSteps: string = '<!-- achieve steps -->';
      let achieveReq: string = undefined;

      if (achievement.TriggerConfig.TriggerQuests.length) {
        let questReqNames: string[] = achievement.TriggerConfig.TriggerQuests.map(q => q.TitleText);
        if (questReqNames.some(s => s && !!s.length)) {
          achieveReq = 'Complete ' + sentenceJoin(questReqNames.map(t => `[[${t}]]`));
          achieveSteps = 'complete ' + sentenceJoin(questReqNames.map(t => `{{Quest|${t}}}`));
        }
      }

      sb.line('{{Achievement Infobox');
      sb.setPropPad(13);
      if (achievementsWithSameName.length > 1) {
        sb.prop('title', achievement.TitleText);
      }
      sb.prop('id', achievement.Id);
      sb.prop('order id', achievement.OrderId);
      sb.prop('category', achievement.Goal.NameText);
      sb.prop('description', achievement.DescText);
      sb.prop('requirements', achieveReq);
      sb.prop('primogems', achievement.FinishReward.RewardSummary.PrimogemCount);
      sb.prop('tracking');
      sb.prop('topic');
      if (achievement.Goal.Id === 0) {
        sb.prop('type');
      }
      sb.prop('quest');
      sb.prop('hidden', achievement.IsHidden ? '1' : '');
      if (achievementsWithSameName.length > 1) {
        sb.prop('set', achievement.TitleText);
        sb.prop('tier', achievementsWithSameName.findIndex(a => a.Id === achievement.Id) + 1);
        sb.prop('tiers_total', achievementsWithSameName.length);
      }
      sb.line('}}');
      sb.line(`'''''${achievement.TitleText}''''' is an [[Achievement]] in the category ''[[${achievement.Goal.NameText}]]''. To complete this achievement, the player needs to ${achieveSteps}.`);
      sb.line(`<!--
==Gameplay Notes==
* 

==Gallery==
{{Preview
|size=300px
|file=
|caption=
}}

==Video Guides==
{{EVT
|video1   = 
|caption1 = 
}}
-->`);
      sb.line('==Other Languages==');
      sb.line((await ol_gen_from_id(ctrl, achievement.TitleTextMapHash)).result);
      sb.line();
      sb.line('==Change History==');
      const crRecord = await ctrl.selectChangeRecordAdded(achievement.Id, 'AchievementExcelConfigData');
      sb.line('{{Change History|' + (crRecord ? crRecord.version : '<!-- version -->') + '}}');
      sb.line();
      sb.line('==Navigation==');
      sb.line('{{Achievement Navbox}}');
      sb.line();
    }

    res.render(AchievementPage, {
      achievement,
      wikitext: sb.toString(),
      title: 'Achievement: ' + (achievement?.TitleText || 'Not Found'),
      bodyClass: ['page--achievements', 'page--achievements-single', 'page--vue'],
    });
  });

  router.get('/achievements/:category?', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const goals = await ctrl.selectAchievementGoals();
    let goalName: string = '';
    let achievements: AchievementsByGoals = null;

    if (req.params.category) {
      let goal = goals.find(goal =>
        paramCmp(goal.NameTextEN, req.params.category) ||
        paramCmp(goal.NameText, req.params.category) ||
        paramCmp(goal.Id, req.params.category)
      );
      if (goal) {
        goalName = goal.NameText;
        achievements = await ctrl.selectAchievements(goal.Id);
      }
    }

    res.render(AchievementListingPage, {
      title: goalName ? `Achievements - ${goalName}` : 'Achievements',
      bodyClass: ['page--achievements', 'page--achievements-categories'],
      category: req.params.category,
      goals,
      achievements
    });
  });
  // endregion

  // region Readables
  // --------------------------------------------------------------------------------------------------------------

  router.get('/readables', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const archive = await ctrl.selectReadableArchive();

    res.render('pages/genshin/archive/readables', {
      title: 'Books & Readables',
      archive: archive,
      bodyClass: ['page--readables', 'page--readables-list']
    });
  });

  router.get('/readables/search', async (req: Request, res: Response) => {
    res.render('pages/genshin/archive/readables-search', {
      title: 'Search Books & Readables',
      bodyClass: ['page--readables-search']
    });
  });

  router.get('/readables/book-collection/:suitId', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const collection: BookSuitExcelConfigData = await ctrl.selectBookCollection(toInt(req.params.suitId));

    let infobox = `{{Book Collection Infobox
|image     = Book ${collection.SuitNameText}.png
|rarity    = ${collection.Books.find(b => b?.Material?.RankLevel)?.Material?.RankLevel}
|volumes   = ${collection.Books.length}
|publisher = 
|author    =`;
    for (let i = 0; i < collection.Books.length; i++) {
      infobox += `\n|vol${i + 1}`.padEnd(12, ' ') + '='
    }
    infobox += '\n}}';

    res.render('pages/genshin/archive/readable-collection', {
      title: collection.SuitNameText,
      collection: collection,
      infobox,
      ol: await ol_gen_from_id(ctrl, collection.SuitNameTextMapHash),
      bodyClass: ['page--readables', 'page--readable-collection']
    });
  });

  router.get('/readables/item/:itemId', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const readable: Readable = await ctrl.selectReadable(toInt(req.params.itemId));

    res.render('pages/genshin/archive/readable-single', {
      title: readable?.TitleText || 'Not Found',
      readable: readable,
      ol: readable ? await ol_gen_from_id(ctrl, readable.TitleTextMapHash) : null,
      bodyClass: ['page--readables', 'page--readable-single']
    });
  });
  // endregion

  // region Loading Tips
  // --------------------------------------------------------------------------------------------------------------

  router.get('/loading-tips', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);

    res.render('pages/genshin/archive/loading-tips', {
      title: 'Loading Tips',
      tableFormat: false,
      catNames: await selectLoadingMainCatNames(ctrl),
      bodyClass: ['page--loading-tips']
    });
  });

  router.get('/loading-tips/:category', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const catName: string = String(req.params.category);
    const tableFormat: boolean = toBoolean(req.query.table);

    const allCat: LoadingCat = await selectLoadingTips(ctrl);

    let cat = allCat.subCats.find(c => toParam(c.catName).toLowerCase() === toParam(catName).toLowerCase());
    if (!cat) {
      cat = allCat.subCats.find(c => Object.values(c.catNameMap).some(x => toParam(x).toLowerCase() === toParam(catName).toLowerCase()));
      req.context.htmlMetaProps['X-ReplaceInUrl'] = catName + ';' + cat.catName;
    }

    res.render('pages/genshin/archive/loading-tips', {
      title: cat ? cat.catName + ' Loading Tips' : 'Loading Tips Not Found',
      catNames: await selectLoadingMainCatNames(ctrl),
      selectedCat: cat?.catName || catName,
      tableFormat,
      wikitext: generateLoadingTipsWikiText(ctrl, cat, 0, tableFormat),
      bodyClass: ['page--loading-tips']
    });
  });
  // endregion

  // Furniture
  // --------------------------------------------------------------------------------------------------------------

  router.get('/furnishing-sets', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const suites = await ctrl.selectAllFurnitureSuite();

    const suiteTree: FurnitureSuiteTree = defaultMap(_cat1 => defaultMap('Array'));

    for (let suite of suites) {
      suiteTree[suite.MainFurnType.TypeName2Text][suite.MainFurnType.TypeNameText].push(suite);
    }

    res.render(FurnishingSetListingPage, {
      title: 'Furnishing Sets',
      bodyClass: ['page--furniture-set'],
      suiteTree,
    });
  });

  router.get('/furnishing-sets/:suiteId', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const suite = await ctrl.selectFurnitureSuite(toInt(req.params.suiteId), {
      LoadUnits: true
    });

    const companionFavorsWikitext: SbOut = new SbOut();
    const companionFavors: {npc: HomeWorldNPCExcelConfigData, event: HomeWorldEventExcelConfigData, dialogue: DialogueSectionResult}[] = [];
    const recipeWikitext: SbOut = new SbOut();

    // Unit Recipe:
    if (suite) {
      recipeWikitext.line('{{Recipe');
      if (suite.MainFurnType.TypeId == 772 || suite.MainFurnType.TypeId == 672) {
        recipeWikitext.line(`|type = ${await ctrl.getTextMapItem(ctrl.outputLangCode, ManualTextMapHashes['Gift Set'])}`);
      } else {
        recipeWikitext.line(`|type = ${await ctrl.getTextMapItem(ctrl.outputLangCode, ManualTextMapHashes['Furnishing Set'])}`);
      }
      for (let unit of suite.Units) {
        recipeWikitext.line(`|${unit.Furniture.NameText.replace(/\|/g, '{{!}}')} = ${unit.Count}`);
      }
      recipeWikitext.line(`|sort = ${suite.Units.map(unit => unit.Furniture.NameText).join(';')}`)
      recipeWikitext.line('|yield = 0');
      recipeWikitext.line('}}');
    }

    // Companion Favors:
    if (suite) {
      companionFavorsWikitext.line(`{{Gift Set Character Interactions`);
      companionFavorsWikitext.setPropPad(12);
      const acc = new TalkConfigAccumulator(ctrl);
      let increment = 1;

      for (let npc of suite.FavoriteNpcVec) {
        for (let rewardEvent of npc.RewardEvents) {
          if (!rewardEvent.TalkId || rewardEvent.FurnitureSuitId !== suite.SuiteId)
            continue;

          const section: DialogueSectionResult = await talkConfigGenerate(ctrl, rewardEvent.TalkId, acc);
          if (!section || !rewardEvent.Reward)
            continue

          section.title = `${npc.Avatar.NameText}'s Dialogue`;
          section.metadata.unshift(new MetaProp('Event ID', rewardEvent.EventId))
          companionFavors.push({
            npc,
            dialogue: section,
            event: rewardEvent
          });

          companionFavorsWikitext.prop(`character_${increment}`, npc.Avatar.NameText);
          companionFavorsWikitext.prop(`rewards_${increment}`, rewardEvent.Reward.RewardSummary.CombinedStringsNoLocale);
          increment++;
        }
      }
      companionFavorsWikitext.prop('type', 'favorite');
      companionFavorsWikitext.prop('set', suite.SuiteNameText);
      companionFavorsWikitext.line(`}}`);
    }

    res.render(FurnishingSetSinglePage, {
      title: 'Furnishing Sets',
      bodyClass: ['page--furniture-set'],
      suite,
      companionFavors,
      companionFavorsWikitext: companionFavorsWikitext.toString(),
      recipeWikitext: recipeWikitext.toString(),
    });
  });

  router.get('/furnishings', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);

    const [furnitureList, typeTree] = await ctrl.cached('HomeWorld:FurnishingsList:' + ctrl.outputLangCode, 'json', async () => {
      return await Promise.all([
        ctrl.selectAllFurniture({ LoadHomeWorldNPC: true }),
        ctrl.selectFurnitureTypeTree(),
      ]);
    });

    res.render('pages/genshin/archive/furniture-list', {
      title: 'Furnishings',
      furnitureList,
      typeTree,
      bodyClass: ['page--furniture', 'page--wide']
    });
  });

  router.get('/furnishings/:furnId', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const furn = await ctrl.selectFurniture(toInt(req.params.furnId), {
      LoadHomeWorldAnimal: true,
      LoadHomeWorldNPC: true,
      LoadMakeData: true,
      LoadRelatedMaterial: true,
    });
    const sb: SbOut = new SbOut();
    const ol: OLResult = furn ? (await ol_gen_from_id(ctrl, furn.NameTextMapHash)) : null;

    if (furn) {
      sb.setPropPad(15);
      sb.line('{{Furnishing Infobox');
      sb.prop('id', furn.Id);
      sb.prop('image', `Item ${furn.NameText}.png`, true);
      sb.prop('category', furn.CategoryNameText);
      sb.prop('subcategory', furn.TypeNameText);
      sb.prop('quality', furn.RankLevel);
      sb.prop('adeptal_energy', furn.Comfort);
      sb.prop('load', furn.Cost);
      sb.prop('reduced_load', furn.DiscountCost);
      sb.prop('description', ctrl.normText(furn.DescText, ctrl.outputLangCode));
      sb.prop('blueprint', '');
      sb.line('}}');
      sb.line(`'''${furn.NameText}''' is a${furn.MakeData ? ' creatable' : ''} [[Furnishing]] item that can be used in the [[Serenitea Pot]].`);
      sb.line();
      if (furn.MakeData) {
        sb.line('==Creation==');
        sb.line(ctrl.generateFurnitureMakeRecipe(furn.MakeData));
        sb.line();
      }
      sb.line('==Furnishing Sets==');
      sb.line('{{Craft Usage}}');
      sb.line();
      sb.line('==Other Languages==');
      sb.line(ol?.result);
      sb.line();
      sb.line('==Change History==');
      const crRecord = await ctrl.selectChangeRecordAdded(furn.Id, 'HomeWorldFurnitureExcelConfigData');
      sb.line('{{Change History|' + (crRecord ? crRecord.version : '<!-- version -->') + '}}');
      sb.line();
      sb.line('==Navigation==');
      if (
        furn.TypeId === 7011 ||  // Curio
        furn.TypeId === 14002 || // Dreambloom
        furn.TypeId === 14003 || // Snowman Component
        furn.TypeId === 14004 || // Floral Scene
        furn.TypeId === 14005 || // Main Flower
        furn.TypeId === 14006 || // Carving Component
        furn.TypeId === 14007    // Shop Components
      ) {
        sb.line('{{Furnishing Navbox/Subsystems|Curio}}');
      } else if (
        furn.TypeId === 3007 || // Fish Tank
        furn.TypeId === 14001 // Ornamental Fish
      ) {
        sb.line('{{Furnishing Navbox/Subsystems|Fish Pond}}');
      } else if (
        furn.TypeId === 9001 || // Indoor Creature
        furn.TypeId === 9002    // Outdoor Creature
      ) {
        sb.line('{{Furnishing Navbox/Living|Animal}}');
      } else if (furn.CategoryId === 10) {
        sb.line('{{Furnishing Navbox/Living|Companion}}');
      } else {
        sb.line(`{{Furnishing Navbox|${furn.IsInterior ? 'interior' : 'exterior'}}}`);
      }
      sb.line();
    }

    res.render('pages/genshin/archive/furniture-page', {
      title: 'Furnishings',
      furn,
      wikitext: sb.toString(),
      bodyClass: ['page--furniture'],
      ol,
    });
  });

  // region Living Beings
  // --------------------------------------------------------------------------------------------------------------
  router.get('/enemies', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const title = (await ctrl.selectManualTextMapConfigDataById('UI_CODEX_ANIMAL_MONSTER')).TextMapContentText;
    const archive = await ctrl.selectLivingBeingArchive();

    res.render('pages/genshin/archive/lb-list', {
      title,
      lbTable: archive.MonsterCodex,
      bodyClass: ['page--lb', 'page--enemies']
    });
  });

  router.get('/wildlife', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const title = (await ctrl.selectManualTextMapConfigDataById('UI_CODEX_ANIMAL_ANIMAL')).TextMapContentText;
    const archive = await ctrl.selectLivingBeingArchive();

    res.render('pages/genshin/archive/lb-list', {
      title,
      lbTable: archive.WildlifeCodex,
      bodyClass: ['page--lb', 'page--wildlife']
    });
  });

  router.get('/enemies/non-codex', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const archive = await ctrl.selectLivingBeingArchive();

    res.render('pages/genshin/archive/lb-list', {
      title: 'Non-Codex Living Beings',
      introText: 'These are living beings that do not appear in the in-game archive.',
      lbTable: archive.NonCodexMonsters,
      bodyClass: ['page--lb', 'page--non-codex-enemies']
    });
  });

  router.get('/enemies/:id', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    let monster = await ctrl.selectMonsterById(toInt(req.params.id), {
      LoadHomeWorldAnimal: true,
      LoadModelArtPath: true,
    });

    if (monster && monster.AnimalDescribe) {
      monster = null;
    }

    res.render('pages/genshin/archive/lb-page', {
      title: monster?.NameText || monster?.Describe?.NameText || 'Enemy not found',
      monster,
      bodyClass: ['page--lb', 'page--enemies']
    });
  });

  router.get('/wildlife/:id', async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    let monster = await ctrl.selectMonsterById(toInt(req.params.id), {
      LoadHomeWorldAnimal: true,
      LoadModelArtPath: true,
    });

    if (monster && !monster.AnimalDescribe) {
      monster = null;
    }

    res.render('pages/genshin/archive/lb-page', {
      title: monster?.NameText || monster?.Describe?.NameText || 'Wildlife not found',
      monster,
      bodyClass: ['page--lb', 'page--wildlife']
    });
  });
  // endregion

  return router;
}
