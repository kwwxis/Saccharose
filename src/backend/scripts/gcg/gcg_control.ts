import '../../loadenv';
import { Control, getControl, normText } from '../script_util';
import {
  GCGCardExcelConfigData, GCGCardViewExcelConfigData,
  GCGChallengeExcelConfigData,
  GCGCharacterLevelExcelConfigData, GCGCharExcelConfigData,
  GCGCostExcelConfigData, GCGDeckCardExcelConfigData, GCGDeckExcelConfigData,
  GCGElementReactionExcelConfigData,
  GCGGameExcelConfigData,
  GCGGameRewardExcelConfigData,
  GCGKeywordExcelConfigData,
  GcgOtherLevelExcelConfigData,
  GCGRuleExcelConfigData,
  GCGRuleTextDetailExcelConfigData,
  GCGRuleTextExcelConfigData,
  GCGSkillTagExcelConfigData,
  GCGTagExcelConfigData,
  GCGTalkDetailExcelConfigData,
  GCGTalkDetailIconExcelConfigData,
  GCGTalkExcelConfigData,
  GCGWeekLevelExcelConfigData,
} from '../../../shared/types/gcg-types';
import { getTextMapItem, getVoPrefix, loadEnglishTextMap, loadVoiceItems } from '../textmap';
import { DialogueSectionResult } from '../dialogue/dialogue_util';
import { pathToFileURL } from 'url';
import { closeKnex } from '../../util/db';
import fs from 'fs';
import { getGenshinDataFilePath } from '../../loadenv';
import { talkConfigGenerate } from '../dialogue/basic_dialogue_generator';
import { normalizeRawJson, schema, SchemaTable } from '../../importer/import_run';

// noinspection JSUnusedGlobalSymbols
export class GCGControl {
  private didInit: boolean = false;
  icons: GCGTalkDetailIconExcelConfigData[];
  rules: GCGRuleExcelConfigData[];
  weekLevels: GCGWeekLevelExcelConfigData[];
  challenges: GCGChallengeExcelConfigData[];
  elementReactions: GCGElementReactionExcelConfigData[];
  tagList: GCGTagExcelConfigData[];
  skillTagList: GCGSkillTagExcelConfigData[];
  keywordList: GCGKeywordExcelConfigData[];
  costDataList: GCGCostExcelConfigData[];

  constructor(readonly ctrl: Control, readonly enableElementalReactionMapping: boolean = false) {}

  async init() {
    if (this.didInit) {
      return;
    } else {
      this.didInit = true;
    }

    this.keywordList = await this.allSelect('GCGKeywordExcelConfigData');
    this.icons = await this.allSelect('GCGTalkDetailIconExcelConfigData');
    this.rules = await this.allSelect('GCGRuleExcelConfigData');

    this.weekLevels = await this.allSelect('GCGWeekLevelExcelConfigData');
    this.challenges = await this.allSelect('GCGChallengeExcelConfigData');

    this.tagList = await this.allSelect('GCGTagExcelConfigData');
    this.skillTagList = await this.allSelect('GCGSkillTagExcelConfigData');
    this.costDataList = await this.allSelect('GCGCostExcelConfigData');

    this.elementReactions = await this.allSelect('GCGElementReactionExcelConfigData'); // must come after skillTagList

    for (let rule of this.rules) {
      if (this.enableElementalReactionMapping) {
        rule.MappedElementReactionList = [];
        for (let elementReactionId of rule.ElementReactionList) {
          let mapped = this.elementReactions.find(x => x.Id === elementReactionId);
          if (mapped) {
            rule.MappedElementReactionList.push(mapped);
          }
        }
      } else {
        delete rule.ElementReactionList;
      }
    }

    for (let weekLevel of this.weekLevels) {
      if (weekLevel.OpenQuestId) {
        weekLevel.OpenQuest = await this.ctrl.selectQuestExcelConfigData(weekLevel.OpenQuestId);
        if (weekLevel.OpenQuest && weekLevel.OpenQuest.MainId) {
          weekLevel.OpenMainQuest = await this.ctrl.selectMainQuestById(weekLevel.OpenQuest.MainId);
        }
      }
    }
  }

  private async defaultPostProcess(o: any): Promise<any> {
    if ('KeywordId' in o) {
      o.Keyword = await this.singleSelect('GCGKeywordExcelConfigData', 'Id', o['KeywordId']);
    }
    if ('SkillId' in o) {
      o.MappedSkill = await this.singleSelect('GCGSkillExcelConfigData', 'Id', o['SkillId']);
    }
    if ('SkillList' in o) {
      o.MappedSkillList = await this.multiSelect('GCGSkillExcelConfigData', 'Id', o['SkillList']);
    }
    if ('TagList' in o) {
      o.MappedTagList = o.TagList.map(tagType => this.tagList.find(tag => tag.Type == tagType)).filter(x => !!x);
    }
    if ('RelatedCharacterTagList' in o) {
      o.MappedRelatedCharacterTagList = o.RelatedCharacterTagList.map(tagType => this.tagList.find(tag => tag.Type == tagType)).filter(x => !!x);
    }
    if ('RelatedCharacterId' in o) {
      o.RelatedCharacter = await this.singleSelect('GCGCharExcelConfigData', 'Id', o['RelatedCharacterId']);
    }
    if ('SkillTagList' in o) {
      o.MappedSkillTagList = o.SkillTagList.map(tagType => this.skillTagList.find(tag => tag.Type == tagType)).filter(x => !!x);
    }
    if ('CostList' in o && Array.isArray(o.CostList)) {
      for (let costItem of o.CostList) {
        costItem.CostData = this.costDataList.find(x => x.Type === costItem.CostType);
      }
    }
    return o;
  }

  private async singleSelect<T>(table: string, field: string, value: any, postProcess?: (o: T) => Promise<T>): Promise<T> {
    await this.init();
    const schemaTable: SchemaTable = schema[table];

    let record: T = await this.ctrl.knex.select('*').from(table)
      .where({[field]: value}).first().then(row => {
        return this.ctrl.commonLoadFirst(row, schemaTable);
      });

    if (record) {
      record = await this.defaultPostProcess(record);
      if (postProcess) {
        postProcess = postProcess.bind(this);
        record = await postProcess(record);
      }
    }

    return record;
  }

  private async multiSelect<T>(table: string, field: string, value: any|any[], postProcess?: (o: T) => Promise<T>): Promise<T[]> {
    await this.init();
    const schemaTable: SchemaTable = schema[table];

    value = Array.isArray(value) ? value : [value];

    let records: T[] = await this.ctrl.knex.select('*').from(table)
      .whereIn(field, value).then(rows => {
        return this.ctrl.commonLoad(rows, schemaTable);
      });

    if (postProcess) {
      postProcess = postProcess.bind(this);
    }

    for (let record of records) {
      await this.defaultPostProcess(record);
      if (postProcess) {
        await postProcess(record);
      }
    }

    let out: T[] = [];

    for (let v of value) {
      let record = records.find(r => r[field] === v);
      if (record) {
        out.push(record);
      }
    }

    return out;
  }

  private async allSelect<T>(table: string, postProcess?: (o: T) => Promise<T>): Promise<T[]> {
    await this.init();
    let records = await this.ctrl.readGenshinDataFile(`./ExcelBinOutput/${table}.json`) as T[];
    if (postProcess) {
      postProcess = postProcess.bind(this);
    }
    for (let record of records) {
      await this.defaultPostProcess(record);
      if (postProcess) {
        await postProcess(record);
      }
    }
    return records;
  }

  // GCG TALK DETAIL
  // --------------------------------------------------------------------------------------------------------------

  private async postProcessTalkDetail(talkDetail: GCGTalkDetailExcelConfigData): Promise<GCGTalkDetailExcelConfigData> {
    talkDetail.VoPrefix = getVoPrefix('Card', talkDetail.TalkDetailId, null, null, false);
    if (talkDetail.TalkDetailIconId) {
      talkDetail.Avatar = await this.ctrl.selectAvatarById(talkDetail.TalkDetailIconId);
      talkDetail.TalkDetailIcon = this.icons.find(icon => icon.Id === talkDetail.TalkDetailIconId);
    }
    return talkDetail;
  }

  async selectAllTalkDetail(): Promise<GCGTalkDetailExcelConfigData[]> {
    return await this.allSelect('GCGTalkDetailExcelConfigData', this.postProcessTalkDetail)
  }

  async selectTalkDetail(id: number): Promise<GCGTalkDetailExcelConfigData> {
    return await this.singleSelect('GCGTalkDetailExcelConfigData', 'TalkDetailId', id, this.postProcessTalkDetail);
  }

  // GCG TALK
  // --------------------------------------------------------------------------------------------------------------

  private async postProcessTalk(talk: GCGTalkExcelConfigData): Promise<GCGTalkExcelConfigData> {
    for (let key of Object.keys(talk)) {
      if (key.endsWith('TalkId')) {
        let newKey = key.slice(0, -2);
        talk[newKey] = await this.selectTalkDetail(talk[key]);
      }
    }
    return talk;
  }

  async selectAllTalk(): Promise<GCGTalkExcelConfigData[]> {
    return await this.allSelect('GCGTalkExcelConfigData', this.postProcessTalk)
  }

  async selectTalkByGameId(gameId: number): Promise<GCGTalkExcelConfigData> {
    return await this.singleSelect('GCGTalkExcelConfigData', 'GameId', gameId, this.postProcessTalk);
  }

  // GCG RULE
  // --------------------------------------------------------------------------------------------------------------

  private async postProcessRuleText(ruleText: GCGRuleTextExcelConfigData): Promise<GCGRuleTextExcelConfigData> {
    ruleText.DetailList = [];
    for (let id of ruleText.DetailIdList) {
      let detail = await this.selectRuleTextDetail(id);
      if (detail) {
        ruleText.DetailList.push(detail);
      }
    }
    return ruleText;
  }

  async selectAllRuleText(): Promise<GCGRuleTextExcelConfigData[]> {
    return await this.allSelect('GCGRuleTextExcelConfigData', this.postProcessRuleText);
  }

  async selectRuleText(id: number): Promise<GCGRuleTextExcelConfigData> {
    return await this.singleSelect('GCGRuleTextExcelConfigData', 'Id', id, this.postProcessRuleText);
  }

  async selectRuleTextDetail(id: number): Promise<GCGRuleTextDetailExcelConfigData> {
    return await this.singleSelect('GCGRuleTextDetailExcelConfigData', 'Id', id);
  }

  // GCG GAME/LEVEL/STAGE
  // --------------------------------------------------------------------------------------------------------------
  private async postProcessStage(stage: GCGGameExcelConfigData, disableLoad: GCGStageLoadOptions = {}): Promise<GCGGameExcelConfigData> {
    stage.QuestLevel = null;
    stage.BossLevel = null;
    stage.WorldLevel = null;
    stage.CharacterLevel = null;
    stage.WeekLevel = null;

    if (!disableLoad.disableRuleLoad) {
      stage.Rule = this.rules.find(rule => rule.Id === stage.RuleId);
    }
    if (!disableLoad.disableTalkLoad) {
      stage.LevelTalk = await this.selectTalkByGameId(stage.Id);
    }
    if (!disableLoad.disableLevelLockLoad) {
      stage.LevelLock = await this.singleSelect('GCGLevelLockExcelConfigData', 'LevelId', stage.Id);
      if (stage.LevelLock && stage.LevelLock.UnlockLevel) {
        stage.MinPlayerLevel = stage.LevelLock.UnlockLevel;
      }
    }
    if (!disableLoad.disableDialogTalkLoad) {
      stage.OtherLevel = await this.singleSelect('GcgOtherLevelExcelConfigData', 'LevelId', stage.Id);
      stage.LevelType = 'OTHER';
      if (stage.OtherLevel && stage.OtherLevel.TalkId) {
        stage.OtherLevel.Talks = [];
        for (let talkId of stage.OtherLevel.TalkId) {
          stage.OtherLevel.Talks.push(await this.ctrl.selectTalkExcelConfigDataById(talkId));
        }
      }
    }
    if (!disableLoad.disableQuestLevelLoad) {
      stage.QuestLevel = await this.singleSelect('GCGQuestLevelExcelConfigData', 'LevelId', stage.Id);
      if (stage.QuestLevel) {
        stage.LevelType = 'QUEST';
        stage.QuestLevel.Quest = await this.ctrl.selectQuestExcelConfigData(stage.QuestLevel.QuestId);
        if (stage.QuestLevel.Quest) {
          stage.QuestLevel.MainQuest = await this.ctrl.selectMainQuestById(stage.QuestLevel.Quest.MainId);
        }
      }
    }
    if (!disableLoad.disableBossLevelLoad) {
      stage.BossLevel = await this.singleSelect('GCGBossLevelExcelConfigData', 'NormalLevelId', stage.Id);
      if (stage.BossLevel) {
        stage.LevelType = 'BOSS';
        stage.LevelDifficulty = 'NORMAL';
        stage.MinPlayerLevel = stage.BossLevel.UnlockGcgLevel;
      } else {
        stage.BossLevel = await this.singleSelect('GCGBossLevelExcelConfigData', 'HardLevelId', stage.Id);
        if (stage.BossLevel) {
          stage.LevelType = 'BOSS';
          stage.LevelDifficulty = 'HARD';
          stage.MinPlayerLevel = stage.BossLevel.UnlockGcgLevel;
        }
      }
    }
    if (!disableLoad.disableWorldLevelLoad) {
      stage.WorldLevel = await this.singleSelect('GCGWorldLevelExcelConfigData', 'LevelId', stage.Id);
      if (stage.WorldLevel) {
        stage.LevelType = 'WORLD';
        if (stage.WorldLevel.TalkId) {
          stage.WorldLevel.Talk = await this.ctrl.selectTalkExcelConfigDataById(stage.WorldLevel.TalkId);
        }
        if (stage.WorldLevel.UnlockCond === 'GCG_LEVEL_UNLOCK_QUEST') {
          stage.WorldLevel.UnlockMainQuest = await this.ctrl.selectMainQuestById(stage.WorldLevel.UnlockParam);
        }
      }
    }
    if (!disableLoad.disableWeekLevelLoad) {
      for (let weekLevel of this.weekLevels) {
        if (weekLevel.LevelCondList.some(cond => cond.LevelId === stage.Id)) {
          let cond = weekLevel.LevelCondList.find(cond => cond.LevelId === stage.Id);
          stage.LevelType = 'WEEK';
          stage.WeekLevel = weekLevel;
          stage.MinPlayerLevel = cond.GcgLevel;
        }
      }
    }
    if (!disableLoad.disableCharacterLevelLoad) {
      stage.CharacterLevel = await this.selectCharacterLevelByLevelId(stage.Id);
      if (stage.CharacterLevel) {
        stage.LevelType = 'CHARACTER';
        stage.LevelDifficulty = 'NORMAL';

        let normalItem = stage.CharacterLevel.NormalLevelList.find(item => item.LevelId === stage.Id);
        if (normalItem) {
          stage.MinPlayerLevel = normalItem.GcgLevel;
        }

        if (stage.Id === stage.CharacterLevel.HardLevelId) {
          stage.LevelDifficulty = 'HARD';
        }

        if (stage.CharacterLevel.CostItemId) {
          stage.CharacterLevel.CostItemMaterial = await this.ctrl.selectMaterialExcelConfigData(stage.CharacterLevel.CostItemId);
        }
        if (stage.CharacterLevel.PreQuestId) {
          stage.CharacterLevel.PreQuest = await this.ctrl.selectQuestExcelConfigData(stage.CharacterLevel.PreQuestId);
          if (stage.CharacterLevel.PreQuest) {
            stage.CharacterLevel.PreMainQuest = await this.ctrl.selectMainQuestById(stage.CharacterLevel.PreQuest.MainId);
          }
        }
        if (stage.CharacterLevel.WinNormalLevelTalkId) {
          stage.CharacterLevel.WinNormalLevelTalk = await this.ctrl.selectTalkExcelConfigDataById(stage.CharacterLevel.WinNormalLevelTalkId);
        }
        if (stage.CharacterLevel.LoseNormalLevelTalkId) {
          stage.CharacterLevel.LoseNormalLevelTalk = await this.ctrl.selectTalkExcelConfigDataById(stage.CharacterLevel.LoseNormalLevelTalkId);
        }
        if (stage.CharacterLevel.WinHardLevelTalkId) {
          stage.CharacterLevel.WinHardLevelTalk = await this.ctrl.selectTalkExcelConfigDataById(stage.CharacterLevel.WinHardLevelTalkId);
        }
        if (stage.CharacterLevel.LoseHardLevelTalkId) {
          stage.CharacterLevel.LoseHardLevelTalk = await this.ctrl.selectTalkExcelConfigDataById(stage.CharacterLevel.LoseHardLevelTalkId);
        }
      }
    }
    if (!disableLoad.disableRewardLoad) {
      stage.Reward = await this.selectReward(stage.Id);
    }
    if (!disableLoad.disableDeckLoad) {
      if (stage.CardGroupId) {
        stage.CardGroup = await this.selectDeck(stage.CardGroupId);
      }
      if (stage.EnemyCardGroupId) {
        stage.EnemyCardGroup = await this.selectDeck(stage.EnemyCardGroupId);
      }
    }
    if (!disableLoad.disableWikiTitleLoad) {
      stage.WikiCharacter = stage.EnemyNameText || '(No character)';
      stage.WikiLevelName = stage?.Reward?.LevelNameText || '(No title)';
      stage.WikiCombinedTitle = `${stage.WikiCharacter}/${stage.WikiLevelName}`;
    }
    if (!disableLoad.disableWikiTypeGroupLoad) {
      stage.WikiGroup = 'No Group';
      stage.WikiType = 'No Type';
      switch (stage.LevelType) {
        case 'BOSS':
          stage.WikiGroup = 'Tavern Challenge';
          break;
        case 'QUEST':
          stage.WikiGroup = 'Quest';
          break;
        case 'WORLD':
          stage.WikiGroup = 'Open World Match';
          if (stage?.Reward?.LevelNameText) {
            let levelNameTextEn = getTextMapItem('EN', stage.Reward.LevelNameTextMapHash);
            if (levelNameTextEn.startsWith('Duel:')) {
              stage.WikiType = 'Duel';
            } else {
              stage.WikiType = 'Adventure Challenge';
            }
          }
          break;
        case 'WEEK':
          stage.WikiType = 'Weekly Guest Challenge';
          break;
        case 'CHARACTER':
          stage.WikiGroup = 'Invitation Board';
          break;
        case 'OTHER':
          break;
      }
      if (stage.LevelLock) {
        stage.WikiType = 'Ascension Challenge';
      }
      if (stage.LevelDifficulty) {
        // Only 'BOSS' and 'CHARACTER' games have level difficulty
        stage.WikiType = stage.LevelDifficulty === 'NORMAL' ? 'Friendly Fracas' : 'Serious Showdown';
      }
    }
    if (stage.Reward && stage.Reward.CondList) {
      for (let cond of stage.Reward.CondList) {
        if (cond.Type === 'GCG_LEVEL') {
          stage.MinPlayerLevel = cond.ParamList[0];
        }
      }
    }
    return stage;
  }

  private async selectCharacterLevelByLevelId(levelId: number): Promise<GCGCharacterLevelExcelConfigData> {
    let ids: number[] = await this.ctrl.knex.select('*').from('Relation_GCGCharacterLevel')
      .where({LevelId: levelId}).pluck('Id').then();
    if (ids.length) {
      return await this.singleSelect('GCGCharacterLevelExcelConfigData', 'Id', ids[0]);
    }
    return null;
  }

  async selectAllStage(disableLoad: GCGStageLoadOptions = {}): Promise<GCGGameExcelConfigData[]> {
    return await this.allSelect('GCGGameExcelConfigData', o => this.postProcessStage(o, Object.assign({
      disableDeckLoad: true
    }, disableLoad)));
  }

  async selectStage(id: number, disableLoad: GCGStageLoadOptions = {}): Promise<GCGGameExcelConfigData> {
    return await this.singleSelect('GCGGameExcelConfigData', 'Id', id, o => this.postProcessStage(o, disableLoad));
  }

  // GCG REWARD
  // --------------------------------------------------------------------------------------------------------------

  private async postProcessReward(reward: GCGGameRewardExcelConfigData, loadRewardExcel: boolean = true): Promise<GCGGameRewardExcelConfigData> {
    if (!reward.ChallengeRewardList) {
      reward.ChallengeRewardList = [];
    }
    for (let item of reward.ChallengeRewardList) {
      if (item.ChallengeId) {
        item.Challenge = this.challenges.find(c => c.Id == item.ChallengeId);
      }
      if (item.RewardId && loadRewardExcel) {
        item.Reward = await this.ctrl.selectRewardExcelConfigData(item.RewardId);
      }
    }
    return reward;
  }

  async selectAllReward(loadRewardExcel: boolean = true): Promise<GCGGameRewardExcelConfigData[]> {
    return await this.allSelect('GCGGameRewardExcelConfigData', o => this.postProcessReward(o, loadRewardExcel))
  }

  async selectReward(levelId: number, loadRewardExcel: boolean = true): Promise<GCGGameRewardExcelConfigData> {
    return await this.singleSelect('GCGGameRewardExcelConfigData', 'LevelId', levelId, o => this.postProcessReward(o, loadRewardExcel));
  }

  // GCG CARD
  // --------------------------------------------------------------------------------------------------------------

  private async postProcessCardView(cardView: GCGCardViewExcelConfigData): Promise<GCGCardViewExcelConfigData> {
    if (cardView.ImagePath) {
      cardView.Image = 'UI_' + cardView.ImagePath;
    }
    return cardView;
  }

  private async postProcessCard(card: GCGCardExcelConfigData): Promise<GCGCardExcelConfigData> {
    card.MappedChooseTargetList = await this.multiSelect('GCGChooseExcelConfigData', 'Id', card.ChooseTargetList);

    if (card.TokenDescId) {
      card.TokenDesc = await this.singleSelect('GCGTokenDescConfigData', 'Id', card.TokenDescId);
    }

    card.CardFace = await this.singleSelect('GCGCardFaceExcelConfigData', 'CardId', card.Id);
    card.CardView = await this.singleSelect('GCGCardViewExcelConfigData', 'Id', card.Id, this.postProcessCardView);

    if (card.CardFace && card.CardFace.ItemId) {
      card.CardFace.ItemMaterial = await this.ctrl.selectMaterialExcelConfigData(card.CardFace.ItemId);
    }

    let deckCard = await this.selectDeckCard(card.Id);
    if (deckCard) {
      card.DeckCard = deckCard;
    }

    return card;
  }

  async selectAllCard(): Promise<GCGCardExcelConfigData[]> {
    return await this.allSelect('GCGCardExcelConfigData', this.postProcessCard)
  }

  async selectCard(id: number): Promise<GCGCardExcelConfigData> {
    return await this.singleSelect('GCGCardExcelConfigData', 'Id', id, this.postProcessCard);
  }

  // GCG DECK CARD GROUP
  // --------------------------------------------------------------------------------------------------------------

  private async postProcessDeck(deck: GCGDeckExcelConfigData): Promise<GCGDeckExcelConfigData> {
    deck.MappedCharacterList = await this.multiSelect('GCGCharExcelConfigData', 'Id',
      deck.CharacterList, this.postProcessChar);

    deck.MappedWaitingCharacterList = await this.multiSelect('GCGCharExcelConfigData', 'Id',
      deck.WaitingCharacterList.map(x => x.Id).filter(x => !!x), this.postProcessChar);

    deck.MappedCardList = await this.multiSelect('GCGCardExcelConfigData', 'Id',
      deck.CardList, this.postProcessCard);

    return deck;
  }

  async selectAllDeck(): Promise<GCGDeckExcelConfigData[]> {
    return await this.allSelect('GCGDeckExcelConfigData', this.postProcessDeck)
  }

  async selectDeck(id: number): Promise<GCGDeckExcelConfigData> {
    return await this.singleSelect('GCGDeckExcelConfigData', 'Id', id, this.postProcessDeck);
  }

  // GCG CHAR
  // --------------------------------------------------------------------------------------------------------------
  async postProcessChar(char: GCGCharExcelConfigData): Promise<GCGCharExcelConfigData> {
    char.CardFace = await this.singleSelect('GCGCardFaceExcelConfigData', 'CardId', char.Id);
    char.CardView = await this.singleSelect('GCGCardViewExcelConfigData', 'Id', char.Id, this.postProcessCardView);

    let deckCard = await this.selectDeckCard(char.Id);
    if (deckCard) {
      char.DeckCard = deckCard;
    }
    return char;
  }

  async selectAllChar(): Promise<GCGCharExcelConfigData[]> {
    return await this.allSelect('GCGCharExcelConfigData', this.postProcessChar);
  }

  async selectChar(id: number): Promise<GCGCharExcelConfigData> {
    return await this.singleSelect('GCGCharExcelConfigData', 'Id', id, this.postProcessChar);
  }

  // GCG DECK CARD
  // --------------------------------------------------------------------------------------------------------------

  private async postProcessDeckCard(card: GCGDeckCardExcelConfigData): Promise<GCGDeckCardExcelConfigData> {
    card.CardFaceList = await this.multiSelect('GCGCardFaceExcelConfigData', 'CardId', card.CardFaceIdList);
    card.CardFace = await this.singleSelect('GCGCardFaceExcelConfigData', 'CardId', card.Id);
    card.CardView = await this.singleSelect('GCGCardViewExcelConfigData', 'Id', card.Id, this.postProcessCardView);

    card.ProficiencyReward = await this.singleSelect('GCGProficiencyRewardExcelConfigData', 'CardId', card.Id);
    if (card.ProficiencyReward) {
      if (!card.ProficiencyReward.ProficiencyRewardList) {
        card.ProficiencyReward.ProficiencyRewardList = [];
      }
      for (let item of card.ProficiencyReward.ProficiencyRewardList) {
        if (item.RewardId) {
          item.Reward = await this.ctrl.selectRewardExcelConfigData(item.RewardId);
        }
      }
    }

    if (card && card.ItemId) {
      card.ItemMaterial = await this.ctrl.selectMaterialExcelConfigData(card.ItemId);
    }


    return card;
  }

  async selectAllDeckCard(): Promise<GCGDeckCardExcelConfigData[]> {
    return await this.allSelect('GCGDeckCardExcelConfigData', this.postProcessDeckCard)
  }

  async selectDeckCard(id: number): Promise<GCGDeckCardExcelConfigData> {
    return await this.singleSelect('GCGDeckCardExcelConfigData', 'Id', id, this.postProcessDeckCard);
  }

  // TODO:
  // async gcgTalkToDialogueSection(talk: GCGTalkExcelConfigData, stageForTalk: GCGGameExcelConfigData): Promise<DialogueSectionResult> {
  //
  // }

  async generateGCGTalkDialogueSections(): Promise<DialogueSectionResult[]> {
    let results: {[gameId: number]: DialogueSectionResult} = {};

    let talks = await this.selectAllTalk();

    for (let talk of talks) {
      let parentSect: DialogueSectionResult;
      if (!results[talk.GameId]) {
        let stage = await this.selectStage(talk.GameId, {
          disableTalkLoad: true,
          disableLevelLockLoad: true,
          disableDeckLoad: true,
        });
        let title = stage.EnemyNameText || String(talk.GameId);
        if (stage?.Reward?.LevelNameText) {
          title += '/' + stage.Reward.LevelNameText
        }
        parentSect = new DialogueSectionResult('GCGTalk_'+talk.GameId, title).afterConstruct(sect => {
          sect.addMetaProp('Stage ID', talk.GameId);
          sect.addMetaProp('Stage Type', stage.LevelType);
          sect.addMetaProp('Stage Difficulty', stage.LevelDifficulty === 'NORMAL' ? 'Friendly Fracas' : 'Serious Showdown');
          sect.addMetaProp('Stage Player Level', stage.MinPlayerLevel);
          if (stage.EnemyNameText) {
            sect.addMetaProp('Enemy Name', stage.EnemyNameText);
          }
          if (stage?.Reward?.LevelNameText) {
            sect.addMetaProp('Level Name', stage.Reward.LevelNameText);
          }
        });
        results[talk.GameId] = parentSect;
        if (stage.OtherLevel && stage.OtherLevel.Talks) {
          for (let talk of stage.OtherLevel.Talks) {
            let talkSect = await talkConfigGenerate(this.ctrl, talk);
            talkSect.title = 'Other Talk';
            parentSect.children.push(talkSect);
          }
        }
        if (stage.WorldLevel && stage.WorldLevel.Talk) {
          let talkSect = await talkConfigGenerate(this.ctrl, stage.WorldLevel.Talk);
          talkSect.title = 'World Talk';
          parentSect.children.push(talkSect);
        }
        if (stage.LevelDifficulty === 'NORMAL') {
          if (stage.CharacterLevel && stage.CharacterLevel.WinNormalLevelTalk) {
            let talkSect = await talkConfigGenerate(this.ctrl, stage.CharacterLevel.WinNormalLevelTalk);
            talkSect.title = 'Win Talk';
            parentSect.children.push(talkSect);
          }
          if (stage.CharacterLevel && stage.CharacterLevel.LoseNormalLevelTalk) {
            let talkSect = await talkConfigGenerate(this.ctrl, stage.CharacterLevel.LoseNormalLevelTalk);
            talkSect.title = 'Lose Talk';
            parentSect.children.push(talkSect);
          }
        }
        if (stage.LevelDifficulty === 'HARD') {
          if (stage.CharacterLevel && stage.CharacterLevel.WinHardLevelTalk) {
            let talkSect = await talkConfigGenerate(this.ctrl, stage.CharacterLevel.WinHardLevelTalk);
            talkSect.title = 'Win Talk';
            parentSect.children.push(talkSect);
          }
          if (stage.CharacterLevel && stage.CharacterLevel.LoseHardLevelTalk) {
            let talkSect = await talkConfigGenerate(this.ctrl, stage.CharacterLevel.LoseHardLevelTalk);
            talkSect.title = 'Lose Talk';
            parentSect.children.push(talkSect);
          }
        }
      }
      parentSect = results[talk.GameId];
      const pushTalkDetailSect = (mode: string, talkDetail: GCGTalkDetailExcelConfigData): DialogueSectionResult => {
        let sect = new DialogueSectionResult('GCGTalk_'+talk.GameId+'_'+talkDetail.TalkDetailIconId, mode).afterConstruct(sect => {
          sect.addMetaProp('Stage ID', talk.GameId);
          sect.addMetaProp('Talk Mode', mode);
          sect.addMetaProp('Icon ID', talkDetail.TalkDetailIconId);
          if (talkDetail?.TalkDetailIcon?.Type === 'NPC') {
            sect.addEmptyMetaProp('NPC');
          }
          if (talkDetail.Avatar) {
            sect.addMetaProp('Avatar ID', talkDetail.Avatar.Id);
            sect.addMetaProp('Avatar Name', talkDetail.Avatar.NameText);
          }
        });

        if (talkDetail.TalkContentText.length === 1) {
          sect.wikitext = `${talkDetail.VoPrefix}${normText(talkDetail.TalkContentText[0], this.ctrl.outputLangCode)}`;
        } else {
          let texts = [];
          if (talkDetail.VoPrefix) {
            texts.push(talkDetail.VoPrefix);
          }
          for (let text of talkDetail.TalkContentText) {
            texts.push(normText(text, this.ctrl.outputLangCode));
          }
          if (texts.length) {
            sect.wikitextArray.push({
              wikitext: texts.join('\n')
            });
          }
        }
        if (sect.wikitext || sect.wikitextArray.length) {
          parentSect.children.push(sect);
        }
        return sect;
      }
      if (talk.HappyTalk) {
        let sect = pushTalkDetailSect('Happy Talk', talk.HappyTalk);
      }
      if (talk.SadTalk) {
        let sect = pushTalkDetailSect('Sad Talk', talk.SadTalk);
      }
      if (talk.ToughTalk) {
        let sect = pushTalkDetailSect('Tough Talk', talk.ToughTalk);
      }
      if (talk.ElementBurstTalk) {
        let sect = pushTalkDetailSect('Elemental Burst', talk.ElementBurstTalk);
      }
      if (talk.HighHealthTalk) {
        let sect = pushTalkDetailSect('High Health', talk.HighHealthTalk);
        sect.addMetaProp('High Health Value', talk.HighHealthValue);
      }
      if (talk.LowHealthTalk) {
        let sect = pushTalkDetailSect('Low Health', talk.LowHealthTalk);
        sect.addMetaProp('Low Health Value', talk.LowHealthValue);
      }
    }
    return Object.values(results).filter(result => result.children.length);
  }
}

export interface GCGStageLoadOptions {
  disableRuleLoad?: boolean,
  disableTalkLoad?: boolean,
  disableDialogTalkLoad?: boolean,
  disableLevelLockLoad?: boolean,
  disableQuestLevelLoad?: boolean,
  disableBossLevelLoad?: boolean,
  disableWorldLevelLoad?: boolean,
  disableWeekLevelLoad?: boolean,
  disableCharacterLevelLoad?: boolean,
  disableRewardLoad?: boolean,
  disableDeckLoad?: boolean,
  disableWikiTitleLoad?: boolean,
  disableWikiTypeGroupLoad?: boolean
}

export function getGCGControl(ctrl: Control) {
  return new GCGControl(ctrl);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    await loadEnglishTextMap();
    await loadVoiceItems();

    const ctrl = getControl();
    const gcg = getGCGControl(ctrl);
    await gcg.init();

    const stages = await gcg.selectAllStage();
    fs.writeFileSync(getGenshinDataFilePath('./stages.json'), JSON.stringify(stages, null, 2), 'utf8');

    for (let stage of stages) {
      if (stage.Reward) {
        for (let hash of stage.Reward.OACBEKOLDFI) {
          let text = getTextMapItem('EN', hash);
          if (text) {
            console.log('OACBEKOLDFI', text);
          }
        }
        for (let hash of stage.Reward.HGDLKEHAKCE) {
          let text = getTextMapItem('EN', hash);
          if (text) {
            console.log('HGDLKEHAKCE', text);
          }
        }
      }
    }

    const cards = await gcg.selectAllCard();
    fs.writeFileSync(getGenshinDataFilePath('./cards.json'), JSON.stringify(cards, null, 2), 'utf8');

    const deckCards = await gcg.selectAllDeckCard();
    fs.writeFileSync(getGenshinDataFilePath('./deck-cards.json'), JSON.stringify(deckCards, null, 2), 'utf8');

    // const decks = await gcg.selectAllDeck();
    // fs.writeFileSync(getGenshinDataFilePath('./decks.json'), JSON.stringify(decks, null, 2), 'utf8');

    const chars = await gcg.selectAllChar();
    // fs.writeFileSync(getGenshinDataFilePath('./characters.json'), JSON.stringify(chars, null, 2), 'utf8');

    const stage1 = await gcg.selectStage(2011);
    fs.writeFileSync(getGenshinDataFilePath('./single-stage-2011.json'), JSON.stringify(stage1, null, 2), 'utf8');

    const stage2 = await gcg.selectStage(11003);
    fs.writeFileSync(getGenshinDataFilePath('./single-stage-11003.json'), JSON.stringify(stage2, null, 2), 'utf8');

    const stage3 = await gcg.selectStage(12105);
    fs.writeFileSync(getGenshinDataFilePath('./single-stage-12105.json'), JSON.stringify(stage3, null, 2), 'utf8');

    const cardIds: number[] = [];
    for (let card of cards) {
      cardIds.push(card.Id);
    }

    const deckCardIds: number[] = [];
    for (let deckCard of deckCards) {
      deckCardIds.push(deckCard.Id);
    }

    const charIds: number[] = [];
    for (let char of chars) {
      charIds.push(char.Id);
    }

    console.log('Total CardExcel:', cardIds.length);
    console.log('Total DeckCardExcel:', deckCardIds.length);
    console.log('Total CharExcel:', charIds.length);
    console.log('DeckCardExcels that have a CardExcel with same ID:', deckCardIds.filter(id => cardIds.includes(id)).length);
    console.log('DeckCardExcels that have a CharExcel with same ID:', deckCardIds.filter(id => charIds.includes(id)).length);
    console.log('CardExcels that have a CharExcel with same ID (should be zero - no overlap):', cardIds.filter(id => charIds.includes(id)).length);

    await closeKnex();
  })();
}