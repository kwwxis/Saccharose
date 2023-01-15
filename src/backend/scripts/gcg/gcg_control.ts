import '../../loadenv';
import { Control, getControl, normText } from '../script_util';
import { cached } from '../../util/cache';
import {
  GCGCardExcelConfigData,
  GCGChallengeExcelConfigData,
  GCGCharacterLevelExcelConfigData,
  GCGCostExcelConfigData,
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
import { getVoPrefix, loadEnglishTextMap, loadVoiceItems } from '../textmap';
import { DialogueSectionResult } from '../dialogue/dialogue_util';
import { pathToFileURL } from 'url';
import { closeKnex } from '../../util/db';
import { AvatarExcelConfigData } from '../../../shared/types/avatar-types';
import util from 'util';
import { DialogExcelConfigData } from '../../../shared/types/dialogue-types';
import fs from 'fs';
import { getGenshinDataFilePath } from '../../loadenv';

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

  constructor(readonly ctrl: Control) {}

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
      rule.MappedElementReactionList = [];
      for (let elementReactionId of rule.ElementReactionList) {
        let mapped = this.elementReactions.find(x => x.Id === elementReactionId);
        if (mapped) {
          rule.MappedElementReactionList.push(mapped);
        }
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
      o.Keyword = this.singleSelect('GCGKeywordExcelConfigData', 'Id', o['KeywordId']);
    }
    if ('SkillId' in o) {
      o.MappedSkill = this.singleSelect('GCGSkillExcelConfigData', 'Id', o['SkillId']);
    }
    if ('SkillList' in o) {
      o.MappedSkillList = this.multiSelect('GCGSkillExcelConfigData', 'Id', o['SkillList']);
    }
    if ('TagList' in o) {
      o.MappedTagList = o.TagList.map(tagType => this.tagList.find(tag => tag.Type == tagType)).filter(x => !!x);
    }
    if ('SkillTagList' in o) {
      console.log(o);
      o.MappedSkillTagList = o.SkillTagList.map(tagType => this.skillTagList.find(tag => tag.Type == tagType)).filter(x => !!x);
    }
    if ('CostList' in o && Array.isArray(o.CostList)) {
      for (let costItem of o.CostList) {
        costItem.CostData = this.costDataList.find(x => x.Type === costItem.Type);
      }
    }
    return o;
  }

  private async singleSelect<T>(table: string, field: string, value: any, postProcess?: (o: T) => Promise<T>): Promise<T> {
    await this.init();
    let record: T = await this.ctrl.knex.select('*').from(table)
      .where({[field]: value}).first().then(this.ctrl.commonLoadFirst);
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
    let records: T[];
    if (Array.isArray(value)) {
      records = await this.ctrl.knex.select('*').from(table)
        .whereIn(field, value).then(this.ctrl.commonLoad);
    } else {
      records = await this.ctrl.knex.select('*').from(table)
        .where({[field]: value}).then(this.ctrl.commonLoad);
    }
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

  async selectAllTalkByGameId(gameId: number): Promise<GCGTalkExcelConfigData[]> {
    return await this.multiSelect('GCGTalkExcelConfigData', 'GameId', gameId, this.postProcessTalk);
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
  private async postProcessStage(stage: GCGGameExcelConfigData): Promise<GCGGameExcelConfigData> {
    stage.Rule = this.rules.find(rule => rule.Id === stage.RuleId);

    stage.Talks = await this.selectAllTalkByGameId(stage.Id);
    stage.LevelLock = await this.singleSelect('GCGLevelLockExcelConfigData', 'LevelId', stage.Id);

    let otherLevelTalk: GcgOtherLevelExcelConfigData = await this.singleSelect('GcgOtherLevelExcelConfigData', 'LevelId', stage.Id);
    if (otherLevelTalk && otherLevelTalk.TalkId) {
      stage.DialogTalks = [];
      for (let talkId of otherLevelTalk.TalkId) {
        stage.DialogTalks.push(await this.ctrl.selectTalkExcelConfigDataById(talkId));
      }
    }

    stage.QuestLevel = await this.singleSelect('GCGQuestLevelExcelConfigData', 'LevelId', stage.Id);
    if (stage.QuestLevel) {
      stage.LevelType = 'QUEST';
      stage.QuestLevel.Quest = await this.ctrl.selectQuestExcelConfigData(stage.QuestLevel.QuestId);
      if (stage.QuestLevel.Quest) {
        stage.QuestLevel.MainQuest = await this.ctrl.selectMainQuestById(stage.QuestLevel.Quest.MainId);
      }
    }

    stage.BossLevel = await this.singleSelect('GCGBossLevelExcelConfigData', 'NormalLevelId', stage.Id);
    if (stage.BossLevel) {
      stage.LevelType = 'BOSS';
      stage.LevelDifficulty = 'NORMAL';
    } else {
      stage.BossLevel = await this.singleSelect('GCGBossLevelExcelConfigData', 'HardLevelId', stage.Id);
      if (stage.BossLevel) {
        stage.LevelType = 'BOSS';
        stage.LevelDifficulty = 'HARD';
      }
    }

    stage.WorldLevel = await this.singleSelect('GCGWorldLevelExcelConfigData', 'LevelId', stage.Id);
    if (stage.WorldLevel) {
      stage.LevelType = 'WORLD';
      if (stage.WorldLevel.TalkId) {
        stage.WorldLevel.Talk = await this.ctrl.selectTalkExcelConfigDataById(stage.WorldLevel.TalkId);
      }
    }

    for (let weekLevel of this.weekLevels) {
      if (weekLevel.LevelCondList.some(cond => cond.LevelId === stage.Id)) {
        stage.LevelType = 'WEEK';
        stage.WeekLevel = weekLevel;
      }
    }

    stage.CharacterLevel = await this.selectCharacterLevelByLevelId(stage.Id);
    if (stage.CharacterLevel) {
      stage.LevelType = 'CHARACTER';
      stage.LevelDifficulty = 'NORMAL';

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

    stage.Reward = await this.selectReward(stage.Id);

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

  async selectAllStage(): Promise<GCGGameExcelConfigData[]> {
    return await this.allSelect('GCGGameExcelConfigData', this.postProcessStage)
  }

  async selectStage(id: number): Promise<GCGGameExcelConfigData> {
    return await this.singleSelect('GCGGameExcelConfigData', 'Id', id, this.postProcessStage);
  }

  // GCG REWARD
  // --------------------------------------------------------------------------------------------------------------

  private async postProcessReward(reward: GCGGameRewardExcelConfigData): Promise<GCGGameRewardExcelConfigData> {
    if (!reward.ChallengeRewardList) {
      reward.ChallengeRewardList = [];
    }
    for (let item of reward.ChallengeRewardList) {
      if (item.ChallengeId) {
        item.Challenge = this.challenges.find(c => c.Id == item.ChallengeId);
      }
      if (item.RewardId) {
        item.Reward = await this.ctrl.selectRewardExcelConfigData(item.RewardId);
      }
    }
    return reward;
  }

  async selectAllReward(): Promise<GCGGameRewardExcelConfigData[]> {
    return await this.allSelect('GCGGameRewardExcelConfigData', this.postProcessReward)
  }

  async selectReward(levelId: number): Promise<GCGGameRewardExcelConfigData> {
    return await this.singleSelect('GCGGameRewardExcelConfigData', 'LevelId', levelId, this.postProcessReward);
  }

  // GCG CARD
  // --------------------------------------------------------------------------------------------------------------

  private async postProcessCard(card: GCGCardExcelConfigData): Promise<GCGCardExcelConfigData> {
    card.MappedChooseTargetList = await this.multiSelect('GCGChooseExcelConfigData', 'Id', card.ChooseTargetList);

    if (card.TokenDescId) {
      card.TokenDesc = await this.singleSelect('GCGTokenDescConfigData', 'Id', card.TokenDescId);
    }

    return card;
  }

  async selectAllCard(): Promise<GCGCardExcelConfigData[]> {
    return await this.allSelect('GCGCardExcelConfigData', this.postProcessCard)
  }

  async selectCard(id: number): Promise<GCGCardExcelConfigData> {
    return await this.singleSelect('GCGCardExcelConfigData', 'Id', id, this.postProcessCard);
  }
}

export function getGCGControl(ctrl: Control) {
  return new GCGControl(ctrl);
}

export type GCGTalkDetailDialogue = {[TalkDetailIconId: number]: {
  dialogue: DialogueSectionResult,
    avatar?: AvatarExcelConfigData,
    TalkDetailIconId: number
}};

export async function generateGCGTalkDetailDialogue(ctrl: Control, details: GCGTalkDetailExcelConfigData[]): Promise<GCGTalkDetailDialogue> {
  let result: GCGTalkDetailDialogue = {};

  for (let detail of details) {
    if (!result[detail.TalkDetailIconId]) {
      result[detail.TalkDetailIconId] = {
        dialogue: new DialogueSectionResult('TalkDetail_'+detail.TalkDetailId, detail?.Avatar?.NameText || String(detail.TalkDetailIconId)).afterConstruct(sect => {
          sect.addMetaProp('Speaker ID', detail.TalkDetailIconId);
          if (detail?.TalkDetailIcon?.Type === 'NPC') {
            sect.addEmptyMetaProp('NPC');
          }
          sect.showGutter = true;
        }),
        avatar: detail.Avatar,
        TalkDetailIconId: detail.TalkDetailIconId,
      }
    }

    const sect = result[detail.TalkDetailIconId].dialogue;
    delete detail.Avatar;
    delete detail.TalkDetailIconId;

    if (detail.TalkContentText.length === 1) {
      sect.wikitext += `\n`;
      sect.wikitext += `${detail.VoPrefix}${normText(detail.TalkContentText[0], ctrl.outputLangCode)}`;
    } else {
      let texts = [];
      if (detail.VoPrefix) {
        texts.push(detail.VoPrefix);
      }
      for (let text of detail.TalkContentText) {
        texts.push(normText(text, ctrl.outputLangCode));
      }
      sect.wikitextArray.push({
        wikitext: texts.join('\n')
      });
    }
  }
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    await loadEnglishTextMap();
    await loadVoiceItems();

    const ctrl = getControl();
    const gcg = getGCGControl(ctrl);
    await gcg.init();

    const res = await gcg.selectAllStage();
    console.log(util.inspect(res, false, null, true));
    fs.writeFileSync(getGenshinDataFilePath('./stages.json'), JSON.stringify(res, null, 2), 'utf8');
    await closeKnex();
  })();
}