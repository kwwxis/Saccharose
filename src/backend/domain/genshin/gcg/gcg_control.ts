import '../../../loadenv';
import { GenshinControl, getGenshinControl, loadGenshinVoiceItems } from '../genshinControl';
import {
  GCGCardExcelConfigData, GCGCardFaceExcelConfigData, GCGCardViewExcelConfigData,
  GCGChallengeExcelConfigData,
  GCGCharacterLevelExcelConfigData, GCGCharExcelConfigData, GCGCharSkillDamage, GCGCommonCard,
  GCGCostExcelConfigData, GCGDeckCardExcelConfigData, GCGDeckExcelConfigData,
  GCGElementReactionExcelConfigData,
  GCGGameExcelConfigData,
  GCGGameRewardExcelConfigData,
  GCGKeywordExcelConfigData,
  GcgOtherLevelExcelConfigData,
  GCGRuleExcelConfigData,
  GCGRuleTextDetailExcelConfigData,
  GCGRuleTextExcelConfigData, GCGSkillExcelConfigData,
  GCGSkillTagExcelConfigData,
  GCGTagExcelConfigData,
  GCGTalkDetailExcelConfigData,
  GCGTalkDetailIconExcelConfigData,
  GCGTalkExcelConfigData,
  GCGWeekLevelExcelConfigData, GcgWorldWorkTimeExcelConfigData, standardElementCodeToGcgKeywordId,
} from '../../../../shared/types/genshin/gcg-types';
import { DialogueSectionResult, TalkConfigAccumulator, talkConfigGenerate } from '../dialogue/dialogue_util';
import { pathToFileURL } from 'url';
import { closeKnex } from '../../../util/db';
import fs from 'fs';
import { getGenshinDataFilePath, IMAGEDIR_GENSHIN_EXT } from '../../../loadenv';
import { SchemaTable } from '../../../importer/import_db';
import { formatTime } from '../../../../shared/types/genshin/general-types';
import { genshinSchema } from '../../../importer/genshin/genshin.schema';
import { LangCode, VoiceItem } from '../../../../shared/types/lang-types';
import { isInt, toInt } from '../../../../shared/util/numberUtil';
import { replaceAsync, splitLimit } from '../../../../shared/util/stringUtil';
import { isUnset } from '../../../../shared/util/genericUtil';
import { findFiles } from '../../../util/shellutil';
import { distance as strdist } from 'fastest-levenshtein';
import path from 'path';
import { cached, cachedSync } from '../../../util/cache';
import { standardElementCode } from '../../../../shared/types/genshin/manual-text-map';
import { NormTextOptions } from '../../generic/genericNormalizers';
import { html2quotes, unnestHtmlTags } from '../../../../shared/mediawiki/mwQuotes';
import { loadGenshinTextSupportingData } from '../genshinText';
import { dialogueGenerateByNpc, NpcDialogueResult } from '../dialogue/basic_dialogue_generator';
import { DialogExcelConfigData } from '../../../../shared/types/genshin/dialogue-types';
import * as console from 'console';
import { sort } from '../../../../shared/util/arrayUtil';

// noinspection JSUnusedGlobalSymbols
export class GCGControl {

  // region GCG Init
  // --------------------------------------------------------------------------------------------------------------
  private didInit: boolean = false;

  // Preloaded Data
  icons: GCGTalkDetailIconExcelConfigData[];
  rules: GCGRuleExcelConfigData[];
  challenges: GCGChallengeExcelConfigData[];
  elementReactions: GCGElementReactionExcelConfigData[];
  costDataList: GCGCostExcelConfigData[];
  worldWorkTime: GcgWorldWorkTimeExcelConfigData[];
  charSkillDamageList: GCGCharSkillDamage[];
  charIcons: string[];
  charIconsLcSet: Set<string> = new Set();
  charIconsAvatar: string[];
  charIconsMonster: string[];
  charIconsEnemy: string[];
  tagList: GCGTagExcelConfigData[];
  skillTagList: GCGSkillTagExcelConfigData[];
  keywordList: GCGKeywordExcelConfigData[];

  // Settings
  disableSkillSelect: boolean = false;

  constructor(readonly ctrl: GenshinControl, readonly enableElementalReactionMapping: boolean = false) {}

  async init() {
    if (this.didInit) {
      return;
    } else {
      this.didInit = true;
    }

    this.charIcons = await cached('GCG_charIcons', async () => {
      return findFiles('UI_Gcg_Char_', IMAGEDIR_GENSHIN_EXT);
    });

    this.charIconsLcSet = new Set<string>(this.charIcons.map(s => s.toLowerCase().replace('.png', '')));
    this.charIconsAvatar = this.charIcons.filter(s => s.includes('AvatarIcon')).map(s => s.replace('.png', ''));
    this.charIconsMonster = this.charIcons.filter(s => s.includes('MonsterIcon')).map(s => s.replace('.png', ''));
    this.charIconsEnemy = this.charIcons.filter(s => s.includes('EnemyIcon')).map(s => s.replace('.png', ''));

    this.charSkillDamageList = await cached('GCG_charSkillDamageList', async () => {
      return await this.ctrl.readDataFile('./GCGCharSkillDamage.json');
    });

    this.keywordList = await cached('GCG_keywordList_' + this.ctrl.outputLangCode, async () => {
      return await this.allSelect('GCGKeywordExcelConfigData');
    });

    this.icons = await cached('GCG_icons', async () => {
      return await this.allSelect('GCGTalkDetailIconExcelConfigData');
    });

    this.rules = await cached('GCG_rules', async () => {
      return await this.allSelect('GCGRuleExcelConfigData');
    });

    this.challenges = await cached('GCG_challenges', async () => {
      return await this.allSelect('GCGChallengeExcelConfigData');
    });

    this.tagList = await cached('GCG_tagList_' + this.ctrl.outputLangCode, async () => {
      return await this.allSelect('GCGTagExcelConfigData');
    });

    this.skillTagList = await cached('GCG_skillTagList_' + this.ctrl.outputLangCode, async () => {
      return await this.allSelect('GCGSkillTagExcelConfigData');
    });

    this.costDataList = await cached('GCG_costDataList', async () => {
      return await this.allSelect('GCGCostExcelConfigData');
    });

    this.worldWorkTime = await cached('GCG_worldWorkTime', async () => {
      return await this.allSelect('GcgWorldWorkTimeExcelConfigData');
    });

    this.elementReactions = await cached('GCG_elementReactions', async () => {
      return await this.allSelect('GCGElementReactionExcelConfigData'); // must come after skillTagList
    });

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
  }
  // endregion

  // region GCG Util
  // --------------------------------------------------------------------------------------------------------------
  async normGcgText(text: string, stripSprite: boolean = true, outputLangCode?: LangCode): Promise<string> {
    if (!text) {
      return text || '';
    }

    text = this.ctrl.normText(text, outputLangCode || this.ctrl.outputLangCode, {skipHtml2Quotes: true});

    text = text.replace(/\$\[K(\d+)(?:\|s(\d+))?]/g, (fm: string, g: string, sNumStr: string) => {
      const id = toInt(g);
      const kwText = this.keywordList.find(kw => kw.Id === id).TitleText;
      return this.ctrl.normText(kwText, outputLangCode || this.ctrl.outputLangCode, {skipHtml2Quotes: true});
    });

    const commonReplace = async (obj: GCGCharExcelConfigData|GCGSkillExcelConfigData|GCGCardExcelConfigData, fm: string, sNumStr: string) => {
      if (!obj) {
        return fm;
      }
      obj.WikiName = await this.normGcgText(obj.NameText);
      if (!isInt(sNumStr)) {
        return obj.WikiName;
      } else {
        const rawText = await this.ctrl.getTextMapItem(this.ctrl.outputLangCode, obj.NameTextMapHash);
        const normText = this.ctrl.normText(rawText, this.ctrl.outputLangCode, { plaintext: false, decolor: false, sNum: toInt(sNumStr), skipHtml2Quotes: true });
        return obj.WikiName !== normText ? `[[${obj.WikiName}|${normText}]]` : `[[${normText}]]`;
      }
    };

    text = await replaceAsync(text, /\$\[A(\d+)(?:\|s(\d+))?]/g, async (fm: string, g: string, sNumStr: string) =>
      commonReplace(await this.selectCharWithoutPostProcess(toInt(g)), fm, sNumStr)
    );

    text = await replaceAsync(text, /\$\[S(\d+)(?:\|s(\d+))?]/g, async (fm: string, g: string, sNumStr: string) =>
      commonReplace(await this.selectSkillWithoutPostProcess(toInt(g)), fm, sNumStr)
    )

    text = await replaceAsync(text, /\$\[C(\d+)(?:\|s(\d+))?]/g, async (fm: string, g: string, sNumStr: string) =>
      commonReplace(await this.selectCardWithoutPostProcess(toInt(g)), fm, sNumStr)
    );

    text = text.replace(/\{\{color\|#FFD780\|(.*?)}}/g, '[[$1]]');

    if (stripSprite) {
      text = text.replace(/\{\{Sprite\|.*?}}/g, '');
    }

    text = unnestHtmlTags(text);
    text = html2quotes(text);

    return text;
  }

  private async defaultPostProcess(o: any): Promise<any> {
    if ('NpcId' in o) {
      o.Npc = await this.ctrl.getNpc(o.NpcId);
    }
    if ('KeywordId' in o) {
      o.Keyword = await this.singleSelect('GCGKeywordExcelConfigData', 'Id', o['KeywordId']);
    }
    if ('TagList' in o) {
      o.MappedTagList = o.TagList.map(tagType => this.tagList.find(tag => tag.Type == tagType)).filter(x => !!x);
    }
    if ('RelatedCharacterTagList' in o) {
      o.MappedRelatedCharacterTagList = o.RelatedCharacterTagList.map(tagType => this.tagList.find(tag => tag.Type == tagType)).filter(x => !!x);
    }
    if ('RelatedCharacterId' in o) {
      o.RelatedCharacter = await this.singleSelect('GCGCharExcelConfigData', 'Id', o['RelatedCharacterId'], this.postProcessCharacterCard);
    }
    if ('CostList' in o && Array.isArray(o.CostList)) {
      for (let costItem of o.CostList) {
        costItem.CostData = this.costDataList.find(x => x.Type === costItem.CostType);
      }
    }
    if (!this.disableSkillSelect) {
      if ('SkillTagList' in o) {
        o.MappedSkillTagList = o.SkillTagList.map(tagType => this.skillTagList.find(tag => tag.Type == tagType)).filter(x => !!x);
      }
      if ('SkillId' in o) {
        o.MappedSkill = await this.singleSelect('GCGSkillExcelConfigData', 'Id', o['SkillId'], this.postProcessSkill);
      }
      if ('SkillList' in o) {
        o.MappedSkillList = await this.multiSelect('GCGSkillExcelConfigData', 'Id', o['SkillList'], this.postProcessSkill);
      }
    }
    return o;
  }

  private async singleSelect<T>(table: string, field: string, value: any, postProcess?: false|((o: T) => Promise<T>)): Promise<T> {
    await this.init();
    const schemaTable: SchemaTable = genshinSchema[table];

    let record: T = await this.ctrl.knex.select('*').from(table)
      .where({[field]: value}).first().then(row => {
        return this.ctrl.commonLoadFirst(row, schemaTable);
      });

    if (postProcess) {
      postProcess = postProcess.bind(this);
    }

    if (record) {
      if (postProcess !== false) {
        record = await this.defaultPostProcess(record);
      }
      if (postProcess) {
        record = await postProcess(record);
      }
    }

    return record;
  }

  private async multiSelect<T>(table: string, field: string, value: any|any[], postProcess?: false|((o: T) => Promise<T>)): Promise<T[]> {
    await this.init();
    const schemaTable: SchemaTable = genshinSchema[table];

    value = Array.isArray(value) ? value : [value];

    let records: T[] = await this.ctrl.knex.select('*').from(table)
      .whereIn(field, value).then(rows => {
        return this.ctrl.commonLoad(rows, schemaTable);
      });

    if (postProcess) {
      postProcess = postProcess.bind(this);
    }

    for (let record of records) {
      if (postProcess !== false) {
        await this.defaultPostProcess(record);
      }
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
    let records = await this.ctrl.readDataFile(`./ExcelBinOutput/${table}.json`) as T[];
    if (postProcess) {
      postProcess = postProcess.bind(this);
    }
    let i = 0;
    for (let record of records) {
      i++;
      await this.defaultPostProcess(record);
      if (postProcess) {
        await postProcess(record);
      }
    }
    return records;
  }
  // endregion

  // region GCG Talk & Talk Detail
  // --------------------------------------------------------------------------------------------------------------

  private async postProcessTalkDetail(talkDetail: GCGTalkDetailExcelConfigData): Promise<GCGTalkDetailExcelConfigData> {
    talkDetail.VoPrefix = this.ctrl.voice.getVoPrefix('Card', talkDetail.TalkDetailId, null, null, false);
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
  // endregion

  // region GCG Rules
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
  // endregion

  // region GCG Game/Level/Stage
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
    if (!disableLoad.disableLevelLockLoad) {
      stage.LevelLock = await this.singleSelect('GCGLevelLockExcelConfigData', 'LevelId', stage.Id);
      if (stage.LevelLock && stage.LevelLock.UnlockLevel) {
        stage.MinPlayerLevel = stage.LevelLock.UnlockLevel;
      }
    }
    if (!disableLoad.disableOtherLevelLoad) {
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
        stage.NpcId = stage.BossLevel.NpcId;
      } else {
        stage.BossLevel = await this.singleSelect('GCGBossLevelExcelConfigData', 'HardLevelId', stage.Id);
        if (stage.BossLevel) {
          stage.LevelType = 'BOSS';
          stage.LevelDifficulty = 'HARD';
          stage.MinPlayerLevel = stage.BossLevel.UnlockGcgLevel;
          stage.NpcId = stage.BossLevel.NpcId;
        }
      }
      if (stage.BossLevel && stage.BossLevel.MonsterId) {
        stage.BossLevel.Monster = await this.ctrl.selectMonsterById(stage.BossLevel.MonsterId);
      }
    }
    if (!disableLoad.disableWorldLevelLoad) {
      stage.WorldLevel = await this.singleSelect('GCGWorldLevelExcelConfigData', 'LevelId', stage.Id);
      if (stage.WorldLevel) {
        stage.LevelType = 'WORLD';
        stage.NpcId = stage.WorldLevel.NpcId;
        if (stage.WorldLevel.TalkId) {
          stage.WorldLevel.Talk = await this.ctrl.selectTalkExcelConfigDataById(stage.WorldLevel.TalkId);
        }
        if (stage.WorldLevel.UnlockCond === 'GCG_LEVEL_UNLOCK_QUEST') {
          stage.WorldLevel.UnlockMainQuest = await this.ctrl.selectMainQuestById(stage.WorldLevel.UnlockParam);
        }
        stage.WorldLevel.WorldWorkTime = this.worldWorkTime.find(wt => wt.Id === stage.WorldLevel.NpcId);
        if (stage.WorldLevel.WorldWorkTime && stage.WorldLevel.MapDescText) {
          stage.WorldLevel.MapDescText = stage.WorldLevel.MapDescText.replace(/\{0}/g, formatTime(stage.WorldLevel.WorldWorkTime.StartTime));
          stage.WorldLevel.MapDescText = stage.WorldLevel.MapDescText.replace(/\{1}/g, formatTime(stage.WorldLevel.WorldWorkTime.EndTime));
        }
      }
    }
    if (!disableLoad.disableWeekLevelLoad) {
      let weekLevelRelation: { LevelId: number, GcgLevel: number, WeekLevelId: number } =
        await this.singleSelect('Relation_GCGGameToWeekLevel', 'LevelId', stage.Id);

      if (weekLevelRelation && weekLevelRelation.WeekLevelId) {
        stage.WeekLevel = await this.singleSelect('GCGWeekLevelExcelConfigData', 'Id', weekLevelRelation.WeekLevelId);
      }

      if (stage.WeekLevel) {
        stage.LevelType = 'WEEK';
        stage.MinPlayerLevel = weekLevelRelation.GcgLevel;
        stage.NpcId = stage.WeekLevel.NpcId;

        if (stage.WeekLevel.OpenQuestId) {
          stage.WeekLevel.OpenQuest = await this.ctrl.selectQuestExcelConfigData(stage.WeekLevel.OpenQuestId);
          if (stage.WeekLevel.OpenQuest && stage.WeekLevel.OpenQuest.MainId) {
            stage.WeekLevel.OpenMainQuest = await this.ctrl.selectMainQuestById(stage.WeekLevel.OpenQuest.MainId);
          }
        }
      }
    }
    if (!disableLoad.disableCharacterLevelLoad) {
      stage.CharacterLevel = await this.selectCharacterLevelByLevelId(stage.Id);
      if (stage.CharacterLevel) {
        stage.LevelType = 'CHARACTER';
        stage.LevelDifficulty = 'NORMAL';
        stage.NpcId = stage.CharacterLevel.NpcId;

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
      stage.WikiGroup = null;
      stage.WikiType = null;
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
            let levelNameTextEn = await this.ctrl.getTextMapItem('EN', stage.Reward.LevelNameTextMapHash);
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
    if (!disableLoad.disableTalkLoad) {
      stage.LevelTalk = await this.selectTalkByGameId(stage.Id);
      await this.populateStageTalk(stage);
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
    return await this.allSelect('GCGGameExcelConfigData', o => this.postProcessStage(o, Object.assign(<GCGStageLoadOptions> {
      disableDeckLoad: true,
      disableTalkLoad: true,
    }, disableLoad)));
  }

  async selectStage(id: number, disableLoad: GCGStageLoadOptions = {}): Promise<GCGGameExcelConfigData> {
    return await this.singleSelect('GCGGameExcelConfigData', 'Id', id, o => this.postProcessStage(o, disableLoad));
  }

  getStageForJson(stage: GCGGameExcelConfigData, unmap: boolean = false): GCGGameExcelConfigData {
    const stageForJson: GCGGameExcelConfigData = Object.assign({}, stage);
    if (stageForJson.EnemyCardGroup) {
      stageForJson.EnemyCardGroup = Object.assign({}, stageForJson.EnemyCardGroup);
      if (unmap) {
        delete stageForJson.EnemyCardGroup.MappedCardList;
        delete stageForJson.EnemyCardGroup.MappedCharacterList;
        delete stageForJson.EnemyCardGroup.MappedWaitingCharacterList;
      }
    }
    if (stageForJson.CardGroup) {
      stageForJson.CardGroup = Object.assign({}, stageForJson.CardGroup);
      if (unmap) {
        delete stageForJson.CardGroup.MappedCardList;
        delete stageForJson.CardGroup.MappedCharacterList;
        delete stageForJson.CardGroup.MappedWaitingCharacterList;
      }
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
    return stageForJson;
  }
  // endregion

  // region GCG Reward
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
    if (reward.TalkDetailIconId) {
      reward.TalkDetailIcon = this.icons.find(icon => icon.Id === reward.TalkDetailIconId);
    }
    return reward;
  }

  async selectAllReward(loadRewardExcel: boolean = true): Promise<GCGGameRewardExcelConfigData[]> {
    return await this.allSelect('GCGGameRewardExcelConfigData', o => this.postProcessReward(o, loadRewardExcel))
  }

  async selectReward(levelId: number, loadRewardExcel: boolean = true): Promise<GCGGameRewardExcelConfigData> {
    return await this.singleSelect('GCGGameRewardExcelConfigData', 'LevelId', levelId, o => this.postProcessReward(o, loadRewardExcel));
  }
  // endregion

  // region GCG Common Card
  // --------------------------------------------------------------------------------------------------------------
  private async postProcessCommonCard(card: GCGCardExcelConfigData|GCGCharExcelConfigData): Promise<GCGCommonCard> {
    if (card.DeckCard) {
      card.WikiImage = card.DeckCard.ItemMaterial.Icon;
      card.WikiName = await this.normGcgText(card.DeckCard.ItemMaterial.NameText);
      card.WikiNameTextMapHash = card.DeckCard.ItemMaterial.NameTextMapHash;
    } else if (card.CardView) {
      card.WikiImage = card.CardView.Image;
      card.WikiName = await this.normGcgText(card.NameText || '(Unnamed)');
      card.WikiNameTextMapHash = card.NameTextMapHash;
    } else {
      card.WikiName = await this.normGcgText(card.NameText || '(Unnamed)');
      card.WikiNameTextMapHash = card.NameTextMapHash;
    }

    const goldenImageExists: boolean = cachedSync('GCG_goldenImageExists_' + card.Id, () => {
      return !!card.WikiImage && fs.existsSync(path.resolve(IMAGEDIR_GENSHIN_EXT, './' + card.WikiImage + '_Golden.png'));
    });
    if (goldenImageExists) {
      card.WikiGoldenImage = card.WikiImage + '_Golden';
    }

    card.WikiDesc = await this.normGcgText(card.DescText);

    switch (card.CardType) {
      case 'GCG_CARD_ASSIST':
        card.WikiType = (await this.ctrl.selectManualTextMapConfigDataById('UI_GCG_CARD_TYPE_SUPPORT')).TextMapContentText;
        break;
      case 'GCG_CARD_EVENT':
        card.WikiType = (await this.ctrl.selectManualTextMapConfigDataById('UI_GCG_CARD_TYPE_EVENT')).TextMapContentText;
        break;
      case 'GCG_CARD_MODIFY':
        card.WikiType = (await this.ctrl.selectManualTextMapConfigDataById('UI_GCG_CARD_TYPE_EQUIP')).TextMapContentText;
        break;
      case 'GCG_CARD_ONSTAGE':
        break;
      case 'GCG_CARD_STATE':
        break;
      case 'GCG_CARD_SUMMON':
        card.WikiType = (await this.ctrl.selectManualTextMapConfigDataById('UI_GCG_CARD_TYPE_SUMMON')).TextMapContentText;
        break;
      case 'GCG_CARD_CHARACTER':
        card.WikiType = (await this.ctrl.selectManualTextMapConfigDataById('UI_GCG_CARD_TYPE_CHAR')).TextMapContentText;
        break;
    }

    card.WikiElement = card.MappedTagList.find(tag => tag.Type.startsWith('GCG_TAG_ELEMENT'))?.NameText || '';
    card.WikiWeapon = card.MappedTagList.find(tag => tag.Type.startsWith('GCG_TAG_WEAPON'))?.NameText || '';
    card.WikiFaction = card.MappedTagList.find(tag => tag.Type.startsWith('GCG_TAG_NATION') || tag.Type.startsWith('GCG_TAG_CAMP'))?.NameText || '';

    return card;
  }
  // endregion

  // region GCG Action Card
  // --------------------------------------------------------------------------------------------------------------

  private async postProcessCardView(cardView: GCGCardViewExcelConfigData): Promise<GCGCardViewExcelConfigData> {
    if (cardView.ImagePath) {
      cardView.Image = 'UI_' + cardView.ImagePath;
    }
    return cardView;
  }

  private async postProcessCardFace(cardFace: GCGCardFaceExcelConfigData): Promise<GCGCardFaceExcelConfigData> {
    if (cardFace && cardFace.ItemId) {
      cardFace.ItemMaterial = await this.ctrl.selectMaterialExcelConfigData(cardFace.ItemId);
    }
    return cardFace;
  }

  private async postProcessActionCard(card: GCGCardExcelConfigData): Promise<GCGCardExcelConfigData> {
    card.MappedChooseTargetList = await this.multiSelect('GCGChooseExcelConfigData', 'Id', card.ChooseTargetList);

    if (card.TokenDescId) {
      card.TokenDesc = await this.singleSelect('GCGTokenDescConfigData', 'Id', card.TokenDescId);
    }

    card.CardFace = await this.singleSelect('GCGCardFaceExcelConfigData', 'CardId', card.Id, this.postProcessCardFace);
    card.CardView = await this.singleSelect('GCGCardViewExcelConfigData', 'Id', card.Id, this.postProcessCardView);

    let deckCard = await this.selectDeckCard(card.Id);
    if (deckCard) {
      card.DeckCard = deckCard;
    }

    card.IsEquipment = card.MappedTagList.some(tag => tag.CategoryType === 'GCG_TAG_IDENTIFIER_MODIFY');
    card.IsSupport = card.MappedTagList.some(tag => tag.CategoryType === 'GCG_TAG_IDENTIFIER_ASSIST');
    card.IsEvent = card.MappedTagList.some(tag => tag.CategoryType === 'GCG_TAG_IDENTIFIER_EVENT');

    await this.postProcessCommonCard(card);

    return card;
  }

  async selectAllCards(): Promise<GCGCardExcelConfigData[]> {
    return await this.allSelect('GCGCardExcelConfigData', this.postProcessActionCard)
  }

  async selectCard(id: number): Promise<GCGCardExcelConfigData> {
    return await this.singleSelect('GCGCardExcelConfigData', 'Id', id, this.postProcessActionCard);
  }

  private async selectCardWithoutPostProcess(id: number): Promise<GCGCardExcelConfigData> {
    return await this.singleSelect('GCGCardExcelConfigData', 'Id', id, false);
  }
  // endregion

  // region GCG Character Card
  // --------------------------------------------------------------------------------------------------------------
  private async postProcessCharacterCard(char: GCGCharExcelConfigData): Promise<GCGCharExcelConfigData> {
    char.CardFace = await this.singleSelect('GCGCardFaceExcelConfigData', 'CardId', char.Id, this.postProcessCardFace);
    char.CardView = await this.singleSelect('GCGCardViewExcelConfigData', 'Id', char.Id, this.postProcessCardView);
    char.VoiceItems = [];

    if (char.AvatarName) {
      char.VoiceItems = this.ctrl.voice.getVoiceItemsByType('Card', char.AvatarName);
    }

    let deckCard = await this.selectDeckCard(char.Id);
    if (deckCard) {
      char.DeckCard = deckCard;
    }

    await this.postProcessCommonCard(char);

    char.CharIcon = this.manualOverrideCharIcon(char.Id);

    if (char.CardView && !char.CharIcon) {
      char.CharIcon = char.CardView.Image
        .replace(/CardFace_Char_Avatar_/, 'Char_AvatarIcon_')
        .replace(/CardFace_Char_Monster_/, 'Char_MonsterIcon_')
        .replace(/CardFace_Char_Enemy_/, 'Char_EnemyIcon_');

      if (!this.charIconsLcSet.has(char.CharIcon.toLowerCase()) && char.AvatarName) {
        char.CharIcon = char.CharIcon.replace(/Icon_.*$/, 'Icon_' + char.AvatarName
          .replace(/Switch_GCG_/i, '')
          .replace(/_/g, ''))
      }
    }

    return char;
  }
  
  private manualOverrideCharIcon(charId: number): string {
    switch (charId) {
      case 1304:
        return 'UI_Gcg_Char_AvatarIcon_Amber';
      case 3104:
        return 'UI_Gcg_Char_EnemyIcon_SkirmisherIce';
      case 3203:
        return 'UI_Gcg_Char_MonsterIcon_SkirmisherWater';
      case 3302:
        return 'UI_Gcg_Char_EnemyIcon_BruteAxeFire';
      case 3401:
        return 'UI_Gcg_Char_EnemyIcon_KairagiElec';
      case 3402:
        return 'UI_Gcg_Char_EnemyIcon_HiliRangeElec';
      case 3403:
        return 'UI_Gcg_Char_EnemyIcon_BruteAxeElec';
      case 3406:
        return 'UI_Gcg_Char_EnemyIcon_SlimeElec';
      case 3502:
        return 'UI_Gcg_Char_MonsterIcon_SkirmisherWind';
      case 3701:
        return 'UI_Gcg_Char_EnemyIcon_UnuAnudattaGrass';
      default:
        return undefined;
    }
  }

  async selectAllCharacterCards(): Promise<GCGCharExcelConfigData[]> {
    return await this.allSelect('GCGCharExcelConfigData', this.postProcessCharacterCard);
  }

  async selectCharacterCard(id: number): Promise<GCGCharExcelConfigData> {
    return await this.singleSelect('GCGCharExcelConfigData', 'Id', id, this.postProcessCharacterCard);
  }

  private async selectCharWithoutPostProcess(id: number): Promise<GCGCharExcelConfigData> {
    return await this.singleSelect('GCGCharExcelConfigData', 'Id', id, false);
  }
  // endregion

  // region GCG Skills
  // --------------------------------------------------------------------------------------------------------------
  async selectSkill(skillId: number): Promise<GCGSkillExcelConfigData> {
    return await this.singleSelect('GCGSkillExcelConfigData', 'Id', skillId, this.postProcessSkill);
  }

  private async selectSkillWithoutPostProcess(skillId: number): Promise<GCGSkillExcelConfigData> {
    return await this.singleSelect('GCGSkillExcelConfigData', 'Id', skillId, false);
  }

  private async setSkillWikiText(skill: GCGSkillExcelConfigData): Promise<void> {
    skill.SkillDamage = this.charSkillDamageList.find(x => x.Name === skill.InternalName);

    if (skill.DescText && skill.SkillDamage) {
      skill.DescText = skill.DescText.replace(/\$\[D__KEY__DAMAGE(\|nc)?]/g, (fm: string) => {
        return isUnset(skill.SkillDamage.Damage) ? fm : String(skill.SkillDamage.Damage);
      });
      skill.DescText = skill.DescText.replace(/\$\[D__KEY__ELEMENT(\|nc)?]/g, (fm: string) => {
        let keyword = this.keywordList.find(kw => kw.Id === skill.SkillDamage.ElementKeywordId);
        if (keyword) {
          return keyword.TitleText;
        }

        // Fallback: guess from element in cost list
        let guessKwId = skill.CostList
          .map(c => standardElementCodeToGcgKeywordId(standardElementCode(c.CostType)))
          .filter(x => !!x)[0];

        keyword = this.keywordList.find(kw => kw.Id === guessKwId);
        if (keyword) {
          return keyword.TitleText;
        }

        return fm;
      });
      skill.DescText = skill.DescText.replaceAll(/\{PLURAL#(\d+)\|(.*?)\|(.*?)}/g,
        (fm: string, numStr: string, ifSingular: string, ifPlural: string) => {
          let num = toInt(numStr);
          if (num > 1) {
            return ifPlural;
          } else {
            return ifSingular;
          }
        });
    }

    skill.WikiDesc = await this.normGcgText(skill.DescText);
  }

  private async postProcessSkill(skill: GCGSkillExcelConfigData): Promise<GCGSkillExcelConfigData> {
    await this.setSkillWikiText(skill);

    skill.WikiName = await this.normGcgText(skill.NameText);
    skill.WikiDesc = await this.normGcgText(skill.DescText);
    skill.WikiType = skill.MappedSkillTagList?.find(tag => tag.Type !== 'GCG_SKILL_TAG_NONE')?.NameText;

    const seenAlready: Set<string> = new Set();

    const extractEffectIds = (desc: string, set: Set<{ type: string, id: number }>) =>
      desc && [... desc.matchAll(/\$\[([CS])(\d+)]/g)]
        .filter(m => !seenAlready.has(m[1] + m[2]))
        .forEach(m => {
          set.add({ type: m[1], id: toInt(m[2]) });
          seenAlready.add(m[1] + m[2]);
        });

    let effectCardIds: Set<{ type: string, id: number }> = new Set();
    extractEffectIds(skill.DescText, effectCardIds);

    while (effectCardIds.size) {
      const newIds: Set<{ type: string, id: number }> = new Set();

      for (let effectItem of effectCardIds) {
        let effectName: string;
        let effectDesc: string;

        if (effectItem.type === 'C') {
          let effectCard = await this.selectCardWithoutPostProcess(effectItem.id);
          effectName = effectCard.NameText;
          effectDesc = await this.normGcgText(effectCard.DescText);
          extractEffectIds(effectCard.DescText, newIds);
        } else if (effectItem.type === 'S') {
          let effectSkill = await this.selectSkillWithoutPostProcess(effectItem.id);
          await this.setSkillWikiText(effectSkill);
          effectName = effectSkill.NameText;
          effectDesc = effectSkill.WikiDesc;
        }
        skill.WikiDesc += `<br /><br />'''` + effectName + `'''<br />` + await this.normGcgText(effectDesc);
      }
      effectCardIds = newIds;
    }


    return skill;
  }
  // endregion

  // region GCG Deck Card Group
  // --------------------------------------------------------------------------------------------------------------

  private async postProcessDeck(deck: GCGDeckExcelConfigData): Promise<GCGDeckExcelConfigData> {
    // Active:
    deck.MappedCharacterList = await this.multiSelect('GCGCharExcelConfigData', 'Id',
      deck.CharacterList, this.postProcessCharacterCard);

    deck.WikiActiveText = deck.MappedCharacterList.map(card => card.WikiName).join(';');

    // Reserve:
    deck.MappedWaitingCharacterList = await this.multiSelect('GCGCharExcelConfigData', 'Id',
      deck.WaitingCharacterList.map(x => x.Id).filter(x => !!x), this.postProcessCharacterCard);

    deck.WikiReserveText = deck.MappedWaitingCharacterList.map(card => card.WikiName).join(';');

    // Re-sort action card list:
    let sortActionMap: Map<number, number> = new Map();
    console.log(deck);
    for (let cardId of deck.CardList) {
      if (sortActionMap.has(cardId)) {
        sortActionMap.set(cardId, sortActionMap.get(cardId) + 1);
      } else {
        sortActionMap.set(cardId, 1);
      }
    }
    let newCardList: number[] = [];
    for (let [cardId, count] of sortActionMap) {
      for (let i = 0; i < count; i++) {
        newCardList.push(cardId);
      }
    }
    deck.CardList = newCardList;

    // Action:
    deck.MappedCardList = await this.multiSelect('GCGCardExcelConfigData', 'Id',
      deck.CardList, this.postProcessActionCard);

    deck.WikiActionText = deck.MappedCardList.map(card => card.WikiName).join(';');

    return deck;
  }

  async selectAllDeck(): Promise<GCGDeckExcelConfigData[]> {
    return await this.allSelect('GCGDeckExcelConfigData', this.postProcessDeck)
  }

  async selectDeck(id: number): Promise<GCGDeckExcelConfigData> {
    return await this.singleSelect('GCGDeckExcelConfigData', 'Id', id, this.postProcessDeck);
  }
  // endregion

  // region GCG Deck Card
  // --------------------------------------------------------------------------------------------------------------

  private async postProcessDeckCard(card: GCGDeckCardExcelConfigData): Promise<GCGDeckCardExcelConfigData> {
    card.CardFaceList = await this.multiSelect('GCGCardFaceExcelConfigData', 'CardId', card.CardFaceIdList, this.postProcessCardFace);
    card.CardFace = await this.singleSelect('GCGCardFaceExcelConfigData', 'CardId', card.Id, this.postProcessCardFace);
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

  private async selectAllDeckCard(): Promise<GCGDeckCardExcelConfigData[]> {
    return await this.allSelect('GCGDeckCardExcelConfigData', this.postProcessDeckCard)
  }

  private async selectDeckCard(id: number): Promise<GCGDeckCardExcelConfigData> {
    return await this.singleSelect('GCGDeckCardExcelConfigData', 'Id', id, this.postProcessDeckCard);
  }
  // endregion

  // region GCG Talks + Dialogue
  // --------------------------------------------------------------------------------------------------------------

  private pushTalkDetailToStageTalk(stage: GCGGameExcelConfigData,
                                    title: string,
                                    talk: GCGTalkExcelConfigData,
                                    talkDetail: GCGTalkDetailExcelConfigData) {
    const sect = new DialogueSectionResult('GCGTalk_'+talk.GameId+'_'+talkDetail.TalkDetailIconId, title)
      .afterConstruct(sect => {
        sect.addMetaProp('Stage ID', { value: talk.GameId, tooltip: stage.StageTalk.title },
          '/TCG/stages/'+String(talk.GameId).padStart(6, '0'));
        sect.addMetaProp('Talk Mode', title);
        sect.addMetaProp('Icon ID', talkDetail.TalkDetailIconId);
        if (talkDetail?.TalkDetailIcon?.Type === 'NPC') {
          sect.addEmptyMetaProp('NPC');
        }
        if (talkDetail.Avatar) {
          sect.addMetaProp('Avatar ID', talkDetail.Avatar.Id);
          sect.addMetaProp('Avatar Name', talkDetail.Avatar.NameText);
        }
      });

    const talker: string = talkDetail.Avatar?.NameText || stage.EnemyNameText;
    const texts: string[] = [];

    for (let i = 0; i < talkDetail.TalkContentText.length; i++) {
      const talkDetailVo = talkDetail.VoPrefix && i === 0 ? talkDetail.VoPrefix : '';
      const text = talkDetail.TalkContentText[i];
      texts.push(`:${talkDetailVo}'''${talker}''': ` + this.ctrl.normText(text, this.ctrl.outputLangCode));
    }

    if (texts.length) {
      sect.wikitext = texts.join('\n');
      stage.StageTalk.children.push(sect);
    }

    return sect;
  }

  private async populateStageTalk(stage: GCGGameExcelConfigData): Promise<void> {
    const gcgTalk: GCGTalkExcelConfigData = stage.LevelTalk;

    stage.StageTalk = new DialogueSectionResult('GCGStageTalk_'+stage.Id, stage.WikiCombinedTitle).afterConstruct(sect => {
      sect.addMetaProp('Stage ID', { value: stage.Id, tooltip: stage.WikiCombinedTitle },
        '/TCG/stages/' + String(stage.Id).padStart(6, '0'));
      sect.addMetaProp('Stage Type', stage.LevelType);
      sect.copyAllSep = '\n\n';
    });

    stage.IdleTalk = new DialogueSectionResult('GCGIdleTalk_'+stage.Id, stage.WikiCombinedTitle);

    const acc = new TalkConfigAccumulator(this.ctrl);

    if (stage.OtherLevel && stage.OtherLevel.Talks) {
      for (let talk of stage.OtherLevel.Talks) {
        let talkSect = await talkConfigGenerate(this.ctrl, talk, acc);
        if (talkSect) {
          talkSect.title = 'Other Talk';
          stage.StageTalk.children.push(talkSect);
        }
      }
    }
    if (stage.WorldLevel && stage.WorldLevel.Talk) {
      let talkSect = await talkConfigGenerate(this.ctrl, stage.WorldLevel.Talk, acc);
      if (talkSect) {
        talkSect.title = 'World Talk';
        stage.StageTalk.children.push(talkSect);
      }
    }

    if (gcgTalk) {
      if (gcgTalk.LowHealthTalk) {
        const sect = this.pushTalkDetailToStageTalk(stage, 'Low Health', gcgTalk, gcgTalk.LowHealthTalk);
        sect.addMetaProp('Low Health Value', gcgTalk.LowHealthValue);

        const lowHealthCard = await this.selectCharacterCard(gcgTalk.LowHealthConfigId);
        if (lowHealthCard) {
          sect.wikitext = `;(When ${stage.EnemyNameText}'s ${lowHealthCard.WikiName}'s Health drops to ${gcgTalk.LowHealthValue} or lower)\n`
            + sect.wikitext;
        }
      }
      if (gcgTalk.HighHealthTalk) {
        const sect = this.pushTalkDetailToStageTalk(stage, 'High Health', gcgTalk, gcgTalk.HighHealthTalk);
        sect.addMetaProp('High Health Value', gcgTalk.HighHealthValue);

        const highHealthCard = await this.selectCharacterCard(gcgTalk.LowHealthConfigId);
        if (highHealthCard) {
          sect.wikitext = `;(When ${stage.EnemyNameText}'s ${highHealthCard.WikiName}'s Health drops to ${gcgTalk.HighHealthValue} or lower)\n`
            + sect.wikitext;
        }
      }
      if (gcgTalk.SadTalk) {
        const sect = this.pushTalkDetailToStageTalk(stage, 'Sad Talk', gcgTalk, gcgTalk.SadTalk);
        sect.wikitext = `;(When the player defeats one of ${stage.EnemyNameText}'s Character Cards)\n` + sect.wikitext;
      }
      if (gcgTalk.ToughTalk) {
        const sect = this.pushTalkDetailToStageTalk(stage, 'Tough Talk', gcgTalk, gcgTalk.ToughTalk);
        sect.wikitext = `;(When the player defeats two of ${stage.EnemyNameText}'s Character Cards)\n` + sect.wikitext;
      }
      if (gcgTalk.HappyTalk) {
        const sect = this.pushTalkDetailToStageTalk(stage, 'Happy Talk', gcgTalk, gcgTalk.HappyTalk);
        sect.wikitext = `;(When ${stage.EnemyNameText} defeats one of the player's Character Cards)\n` + sect.wikitext;
      }
      if (gcgTalk.ElementBurstTalk) {
        const sect = this.pushTalkDetailToStageTalk(stage, 'Elemental Burst', gcgTalk, gcgTalk.ElementBurstTalk);
        sect.wikitext = `;(When ${stage.EnemyNameText} uses an Elemental Burst)\n` + sect.wikitext;
      }
    }

    if (stage.LevelDifficulty === 'NORMAL') {
      if (stage.CharacterLevel && stage.CharacterLevel.WinNormalLevelTalk) {
        let talkSect = await talkConfigGenerate(this.ctrl, stage.CharacterLevel.WinNormalLevelTalk, acc);
        if (talkSect) {
          talkSect.title = 'Win Talk';
          talkSect.wikitext = `;(If the player wins the match)\n` + talkSect.wikitext;
          stage.StageTalk.children.push(talkSect);
        }
      }
      if (stage.CharacterLevel && stage.CharacterLevel.LoseNormalLevelTalk) {
        let talkSect = await talkConfigGenerate(this.ctrl, stage.CharacterLevel.LoseNormalLevelTalk, acc);
        if (talkSect) {
          talkSect.title = 'Lose Talk';
          talkSect.wikitext = `;(If the player loses the match)\n` + talkSect.wikitext;
          stage.StageTalk.children.push(talkSect);
        }
      }
    }
    if (stage.LevelDifficulty === 'HARD') {
      if (stage.CharacterLevel && stage.CharacterLevel.WinHardLevelTalk) {
        let talkSect = await talkConfigGenerate(this.ctrl, stage.CharacterLevel.WinHardLevelTalk, acc);
        if (talkSect) {
          talkSect.title = 'Win Talk';
          talkSect.wikitext = `;(If the player wins the match)\n` + talkSect.wikitext;
          stage.StageTalk.children.push(talkSect);
        }
      }
      if (stage.CharacterLevel && stage.CharacterLevel.LoseHardLevelTalk) {
        let talkSect = await talkConfigGenerate(this.ctrl, stage.CharacterLevel.LoseHardLevelTalk, acc);
        if (talkSect) {
          talkSect.title = 'Lose Talk';
          talkSect.wikitext = `;(If the player loses the match)\n` + talkSect.wikitext;
          stage.StageTalk.children.push(talkSect);
        }
      }
    }

    if (stage.NpcId) {
      const npcDialogue: NpcDialogueResult = (await dialogueGenerateByNpc(this.ctrl, stage.NpcId, acc, true))?.resultMap[stage.NpcId];
      if (npcDialogue && npcDialogue.nonQuestDialogue) {
        const sections = npcDialogue.nonQuestDialogue;

        for (let section of sections) {
          if (section.originalData.talkConfig) {
            const talk = section.originalData.talkConfig;
            const firstDialog = section.originalData.talkConfig.Dialog[0];

            if (talk.BeginCond) {
              const npcType: number = toInt(talk.BeginCond.find(c => c.Type === 'QUEST_COND_GCG_NPC_TYPE')?.Param?.[1]);
              const inviteType: number = toInt(talk.BeginCond.find(c => c.Type === 'QUEST_COND_GCG_INVITE_TYPE')?.Param?.[0]);

              // npcType = 1 -> CHARACTER
              // npcType = 2 -> WEEK
              // inviteType = 0 -> EASY
              // inviteType = 1 -> HARD

              let talkSect: DialogueSectionResult;

              if (npcType === 1 && stage.LevelType === 'CHARACTER') {
                let talkAcc = new TalkConfigAccumulator(this.ctrl).setMaxDepth(1);
                talkSect = await talkConfigGenerate(this.ctrl, talk.Id, talkAcc);

                if (inviteType === 0 && stage.LevelDifficulty === 'HARD') {
                  talkSect = null;
                }
                if (inviteType === 1 && stage.LevelDifficulty === 'NORMAL') {
                  talkSect = null;
                }
              }

              if (npcType === 2 && stage.LevelType === 'WEEK') {
                let talkAcc = new TalkConfigAccumulator(this.ctrl).setMaxDepth(1);
                talkSect = await talkConfigGenerate(this.ctrl, talk.Id, talkAcc);
              }

              if (talkSect) {
                talkSect.title = 'Intro';
                talkSect.wikitext = `;(Talk to ${stage.EnemyNameText})\n` + talkSect.wikitext;
                stage.StageTalk.children.unshift(talkSect);
              }
            }

            if (talk.BeginCond && stage.LevelType === 'WEEK') {
              let challengeResult: number = toInt(talk.BeginCond.find(c => c.Type === 'QUEST_COND_GCG_WORLD_CHALLENGE_RESULT')?.Param?.[0]);
              let talkSect: DialogueSectionResult;

              if (challengeResult === 1) {
                talkSect = await talkConfigGenerate(this.ctrl, talk.Id);
                talkSect.title = 'Win Talk';
                talkSect.wikitext = `;(If the player wins the match)\n` + talkSect.wikitext;
              }

              if (challengeResult === -1) {
                talkSect = await talkConfigGenerate(this.ctrl, talk.Id);
                talkSect.title = 'Lose Talk';
                talkSect.wikitext = `;(If the player loses the match)\n` + talkSect.wikitext;
              }

              if (talkSect) {
                stage.StageTalk.children.push(talkSect);
              }
            }
          } else if (section.originalData.dialogBranch) {
            let dialog = section.originalData.dialogBranch[0];
            let idleSect = new DialogueSectionResult('Dialog_'+dialog.Id, 'Idle Quote');
            idleSect.addMetaProp('Dialogue ID', dialog.Id);
            idleSect.wikitext = ':{{DIcon|Idle}} ' + dialog.TalkContentText;

            stage.IdleTalk.children.unshift(idleSect);
          }
        }
      }
    }
  }
  // endregion
}

export interface GCGStageLoadOptions {
  disableRuleLoad?: boolean,
  disableTalkLoad?: boolean,
  disableOtherLevelLoad?: boolean,
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

export function getGCGControl(ctrl: GenshinControl) {
  return new GCGControl(ctrl);
}

// region CLI
// --------------------------------------------------------------------------------------------------------------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    await loadGenshinTextSupportingData();
    await loadGenshinVoiceItems();

    const ctrl = getGenshinControl();
    const gcg = getGCGControl(ctrl);
    await gcg.init();

    console.inspect(await gcg.selectCharacterCard(1506));


    // const stages = await gcg.selectAllStage();
    // fs.writeFileSync(getGenshinDataFilePath('./stages.json'), JSON.stringify(stages, null, 2), 'utf8');
    //
    // const cards = await gcg.selectAllCards();
    // fs.writeFileSync(getGenshinDataFilePath('./cards.json'), JSON.stringify(cards, null, 2), 'utf8');
    //
    // const deckCards = await gcg.selectAllDeckCard();
    // fs.writeFileSync(getGenshinDataFilePath('./deck-cards.json'), JSON.stringify(deckCards, null, 2), 'utf8');
    //
    // // const decks = await gcg.selectAllDeck();
    // // fs.writeFileSync(getGenshinDataFilePath('./decks.json'), JSON.stringify(decks, null, 2), 'utf8');
    //
    // const chars = await gcg.selectAllCharacterCards();
    // // fs.writeFileSync(getGenshinDataFilePath('./characters.json'), JSON.stringify(chars, null, 2), 'utf8');
    //
    // const stage1 = await gcg.selectStage(2011);
    // fs.writeFileSync(getGenshinDataFilePath('./single-stage-2011.json'), JSON.stringify(stage1, null, 2), 'utf8');
    //
    // const stage2 = await gcg.selectStage(11003);
    // fs.writeFileSync(getGenshinDataFilePath('./single-stage-11003.json'), JSON.stringify(stage2, null, 2), 'utf8');
    //
    const stage3 = await gcg.selectStage(12105);
    fs.writeFileSync(getGenshinDataFilePath('./single-stage-12105.json'), JSON.stringify(stage3, null, 2), 'utf8');
    //
    // const cardIds: number[] = [];
    // for (let card of cards) {
    //   cardIds.push(card.Id);
    // }
    //
    // const deckCardIds: number[] = [];
    // for (let deckCard of deckCards) {
    //   deckCardIds.push(deckCard.Id);
    // }
    //
    // const charIds: number[] = [];
    // for (let char of chars) {
    //   charIds.push(char.Id);
    // }
    //
    // console.log('Total CardExcel:', cardIds.length);
    // console.log('Total DeckCardExcel:', deckCardIds.length);
    // console.log('Total CharExcel:', charIds.length);
    // console.log('DeckCardExcels that have a CardExcel with same ID:', deckCardIds.filter(id => cardIds.includes(id)).length);
    // console.log('DeckCardExcels that have a CharExcel with same ID:', deckCardIds.filter(id => charIds.includes(id)).length);
    // console.log('CardExcels that have a CharExcel with same ID (should be zero - no overlap):', cardIds.filter(id => charIds.includes(id)).length);

    await closeKnex();
  })();
}
// endregion