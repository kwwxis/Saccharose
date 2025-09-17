import { DialogWikitextResult } from '../../../../shared/types/common-types.ts';
import { DialogueSectionResult } from '../../../util/dialogueSectionResult.ts';
import {
  TalkExcelBeginCondType,
  TalkExcelConfigData,
  TalkExcelFinishExecType,
} from '../../../../shared/types/genshin/dialogue-types.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { GenshinControl } from '../genshinControl.ts';
import {
  QuestExcelConfigData,
  QuestExcelConfigDataFailCondType, QuestExcelConfigDataFailExecType, QuestExcelConfigDataFinishCondType,
  QuestExcelConfigDataFinishExecType,
} from '../../../../shared/types/genshin/quest-types.ts';
import { toBoolean } from '../../../../shared/util/genericUtil.ts';
import { IMetaPropValue, MetaPropsHelper } from '../../../util/metaProp.ts';
import { ConfigCondition } from '../../../../shared/types/genshin/general-types.ts';

type MappingHandler = (ctrl: GenshinControl, props: MetaPropsHelper, p0: number|string, p1: number|string, p2: number|string, p3: number|string) => Promise<void>;

type MappingType = TalkExcelBeginCondType | TalkExcelFinishExecType |
  QuestExcelConfigDataFailCondType | QuestExcelConfigDataFailExecType |
  QuestExcelConfigDataFinishCondType | QuestExcelConfigDataFinishExecType;

const MAPPING: Partial<Record<MappingType, MappingHandler>> = {
  QUEST_COND_AVATAR_FETTER_GT: async (ctrl: GenshinControl, props, p0, p1) => {
    const avatarExcel = await ctrl.selectAvatarById(toInt(p0));
    props.addProp('Friendship for', [
      { value: avatarExcel?.NameText, bold: true },
      'is greater than', p1
    ]);
  },
  QUEST_COND_AVATAR_FETTER_LT: async (ctrl: GenshinControl, props, p0, p1) => {
    const avatarExcel = await ctrl.selectAvatarById(toInt(p0));
    props.addProp('Friendship for', [
      { value: avatarExcel?.NameText, bold: true },'is less than', p1
    ]);
  },
  QUEST_COND_AVATAR_FETTER_EQ: async (ctrl: GenshinControl, props, p0, p1) => {
    const avatarExcel = await ctrl.selectAvatarById(toInt(p0));
    props.addProp('Friendship for', [
      { value: avatarExcel?.NameText, bold: true },
      'equals', p1
    ]);
  },
  QUEST_COND_IS_DAYTIME: async (ctrl: GenshinControl, props, p0, p1) => {
    if (toBoolean(p0)) {
      props.addEmptyProp('Daytime Only');
    } else {
      props.addEmptyProp('Nighttime Only');
    }
  },
  QUEST_COND_PLAYER_TEAM_CONTAINS_AVATAR: async (ctrl: GenshinControl, props, p0, p1) => {
    const avatarExcel = await ctrl.selectAvatarById(toInt(p0));
    props.addProp('Player team contains avatar', [
      { value: avatarExcel?.NameText || p0, bold: true },
    ]);
  },
  QUEST_COND_PLAYER_TEAM_NOT_CONTAINS_AVATAR: async (ctrl: GenshinControl, props, p0, p1) => {
    const avatarExcel = await ctrl.selectAvatarById(toInt(p0));
    props.addProp('Player team does not contain avatar', [
      { value: avatarExcel?.NameText || p0, bold: true },
    ]);
  },
  QUEST_COND_PLAYER_HAVE_AVATAR: async (ctrl: GenshinControl, props, p0, p1) => {
    const avatarExcel = await ctrl.selectAvatarById(toInt(p0));
    props.addProp('Player owns avatar', [
      { value: avatarExcel?.NameText || p0, bold: true },
    ]);
  },
  QUEST_COND_PLAYER_CURRENT_AVATAR: async (ctrl: GenshinControl, props, p0, p1) => {
    const avatarExcel = await ctrl.selectAvatarById(toInt(p0));
    props.addProp('Current avatar is', [
      { value: avatarExcel?.NameText || p0, bold: true },
    ]);
  },
  QUEST_COND_PLAYER_CURRENT_NOT_AVATAR: async (ctrl: GenshinControl, props, p0, p1) => {
    const avatarExcel = await ctrl.selectAvatarById(toInt(p0));
    props.addProp('Current avatar is not', [
      { value: avatarExcel?.NameText || p0, bold: true },
    ]);
  },
  QUEST_COND_PLAYER_CHOOSE_MALE: async (ctrl: GenshinControl, props, p0, p1) => {
    if (toBoolean(p0)) {
      props.addEmptyProp('Player chose male traveler');
    } else {
      props.addEmptyProp('Player chose female traveler');
    }
  },
  QUEST_EXEC_ROLLBACK_QUEST: async (ctrl, props, p0, p1) => {
    props.addProp('Rollback to quest section', [
      await questExcelMetaPropValue(ctrl, p0)
    ]);
  },

  QUEST_CONTENT_QUEST_STATE_EQUAL: async (ctrl, props, p0) => {
    props.addProp('Quest State', [
      'EQUAL',
      await questExcelMetaPropValue(ctrl, p0)
    ]);
  }
};

async function doMapping(ctrl: GenshinControl, helper: MetaPropsHelper, cond: ConfigCondition<MappingType>, noMatchCallback?: MappingHandler) {
  const p0 = cond.Param[0];
  const p1 = cond.Param[1];
  const p2 = cond.Param[2];
  const p3 = cond.Param[3];

  const mappingHandler = MAPPING[cond.Type];

  if (mappingHandler) {
    await mappingHandler(ctrl, helper, p0, p1, p2, p3);
  } else if (noMatchCallback) {
    await noMatchCallback(ctrl, helper, p0, p1, p2, p3);
  }
}

export async function addMetaProps_questExcel(ctrl: GenshinControl, sect: DialogueSectionResult, questSub: QuestExcelConfigData) {
  let finishCondPropsHelpers = MetaPropsHelper.of(sect.finishCondProps);
  let finishExecPropsHelpers = MetaPropsHelper.of(sect.finishExecProps);
  let failCondPropsHelpers = MetaPropsHelper.of(sect.failCondProps);
  let failExecPropsHelpers = MetaPropsHelper.of(sect.failExecProps);

  for (let cond of (questSub.FinishCond || [])) {
    await doMapping(ctrl, finishCondPropsHelpers, cond, async (_ctrl, props) => {
      props.addProp(cond.Type, cond.Param);
    });
  }
  for (let exec of (questSub.FinishExec || [])) {
    await doMapping(ctrl, finishExecPropsHelpers, exec, async (_ctrl, props) => {
      props.addProp(exec.Type, exec.Param);
    });
  }
  for (let cond of (questSub.FailCond || [])) {
    await doMapping(ctrl, failCondPropsHelpers, cond, async (_ctrl, props) => {
      props.addProp(cond.Type, cond.Param);
    });
  }
  for (let exec of (questSub.FailExec || [])) {
    await doMapping(ctrl, failExecPropsHelpers, exec, async (_ctrl, props) => {
      props.addProp(exec.Type, exec.Param);
    });
  }
}

export async function addMetaProps_talkConfig_beginCond(ctrl: GenshinControl, sect: DialogueSectionResult, talkConfig: TalkExcelConfigData) {
  let beginCondPropsHelper = MetaPropsHelper.of(sect.beginCondProps);

  for (let beginCond of (talkConfig.BeginCond || [])) {
    await doMapping(ctrl, beginCondPropsHelper, beginCond, async (ctrl, props, p0) => {
      if (beginCond.Type.startsWith('QUEST_COND_STATE_')) {
        props.addProp(beginCond.Type, [
          await questExcelMetaPropValue(ctrl, p0)
        ]);
      } else {
        props.addProp(beginCond.Type, [
          ... beginCond.Param
        ]);
      }
    });
  }
}

export async function addMetaProps_talkConfig_finishExec(ctrl: GenshinControl, sect: DialogueSectionResult, talkConfig: TalkExcelConfigData) {
  let finishExecPropsHelpers = MetaPropsHelper.of(sect.finishExecProps);

  for (let exec of (talkConfig.FinishExec || [])) {
    await doMapping(ctrl, finishExecPropsHelpers, exec, async (ctrl, props, p0) => {
      props.addProp(exec.Type, exec.Param);
    });
  }
}

async function questExcelMetaPropValue(ctrl: GenshinControl, p0: string|number): Promise<IMetaPropValue> {
  let questExcel = await ctrl.selectQuestExcelConfigData(p0);
  let questName = (questExcel ? await ctrl.selectMainQuestName(questExcel.MainId) : null) || '(No title)';
  return {
    value: p0,
    tooltip: questName + ' (Section ' + p0 + ')',
    link: questExcel ? '/genshin/quests/' + questExcel.MainId + '#Section_' + p0 : null
  };
}
