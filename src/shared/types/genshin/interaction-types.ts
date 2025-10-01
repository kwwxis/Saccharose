import { SchemaTable } from '../../../backend/importer/import_db.ts';

export const InterActionSchema = <SchemaTable> {
  name: 'InterAction',
  columns: [],
  jsonFile: '',

  // TODO: This needs to be updated with each new Genshin version! (maybe)
  renameFields: {
    CIOBDALMHGN: 'DialogIdList', // 4.1
    MLAABINGLAA: 'DialogIdList', // 4.2
    BCOOIEMOMBL: 'DialogIdList', // 4.3
    NDMMOPDPKNF: 'DialogIdList', // 4.4
    HLOONFICMOJ: 'DialogIdList', // 4.5

    MCAHMAIKDKH: 'GrpIdList', // 4.1
    HPBPDBFGKID: 'GrpIdList', // 4.2
    DLIPJKNKANK: 'GrpIdList', // 4.3
    FPDBIEGHMCD: 'GrpIdList', // 4.4
    BJBCCFDIICN: 'GrpIdList', // 4.5

    GBAPKLGILDP: 'DialogId', // 4.1
    KICBIOMGHIN: 'DialogId', // 4.2
    KPKFJANJAJM: 'DialogId', // 4.3
    NMKEDPFEKBH: 'DialogId', // 4.4
    ACDCGBPKCAF: 'DialogId', // 4.5

    EDFJOBOJFBD: 'CutsceneIndex', // 4.1
    LMHLEOPOLEK: 'CutsceneIndex', // 4.2
    MGKDCJOKIGC: 'CutsceneIndex', // 4.3
    AKFCJIPDODB: 'CutsceneIndex', // 4.4
    NLOMFPEHHKP: 'CutsceneIndex', // 4.5
  },
};

/**
 * Dialogue ID -> InterActionD2FCandidate[]
 */
export type InterActionD2F = {[id: number]: InterActionD2FCandidate[]};

/**
 * [file name, group id, group index]
 */
export type InterActionD2FCandidate = [string, number, number];

//region Enum Types
export type InterActionType =
  // Camera
  'CAMERA_FOCUS' |
  'CAMERA_MOVE' |
  'CAMERA_DOF' |
  'CAMERA_POST_PROCESS' |
  'DUAL_CAMERA' |
  'CAMERA_SHAKE' |
  'NEW_CAMERA_SHAKE' |
  'CAMERA_SPLINE' |
  'CAMERA_FOCUS_NEW' |
  'CAMERA_ORBIT_ENTITY' |

  // Movement
  'LOOK_AT' |
  'MOVE_TO' |
  'TELEPORT_TO' |
  'LOOK_AT_EYECTRL' |
  'STEER_TO' |
  'SIT_OR_STAND' |

  // Animation/Misc
  'SET_ANIMATOR_SPEED' |
  'PLAY_FRAME_FACE_ANIMATION' |
  'SET_ANIMATOR' |
  'PART_ANIM_CONTROL' |
  'LOCAL_GADGET_OP' |
  'CLOSE_GPU_CULLING' |
  'SET_MODEL_TRANSFORM' |
  'COLLIDER_OP' |
  'SPAWN_ATTACH' |
  'PLAY_POST_EFFECT' |
  'SPECIAL_ELEMENT_VIEW' |
  'STREAM_HOT_SPOT' |
  'SET_SCENE_LIGHT' |
  'TIME_PROTECT' |
  'EMOTION_TEMPLATE' |
  'VISIBLE' |
  'BODY_LANG' |
  'EMO_SYNC' |
  'WAIT_TRIGGER' |
  'ATTACH_OPERATE' |
  'SECTR_CONTROL' |
  'HIDE_WIDGET_PET' |
  'REQUEST_MSG' |
  'BAN_SELF_GLOBAL_VALUE' |
  'EMOJI_BUBBLE' |
  'SPEECH_BUBBLE' |
  'SHOP_EXCHANGE' |
  'PLAY_EFFECT' |

  // NpcFirstMet
  'FIRST_SIGHT' |

  // Audio/Sound
  'AUDIO_PLAY' |
  'AUDIO_SWITCH' |
  'AUDIO_RTPC' |
  'SOUND' |
  'ADAPTIVE_SOUND' |

  // Dialog
  'DIALOG' |
  'DIALOG_SELECT' |
  'DIALOG_CLEAR' |

  // Video/Cutscene/CG
  'SHOW_BG_PIC' |
  'CUTSCENE' |
  'VIDEO_PLAY' |

  // Black Screen
  'SIMPLE_BLACK_SCREEN' |
  'BLACK_SCREEN' |

  // Quest Control
  'CHANGE_TIME' |

  // Group Control
  'SKIP_GROUP' |
  'RANDOM_JUMP_GROUP' |

  // NPC
  'SET_NPC_ARM' |
  'SET_PLAYER_NPC_ENERGY_TYPE' |
  'SET_NPC_MAT_PROP_VALUE' |
  'CHANGE_NPC_MAT' |
  'SET_NPC_FLOATING_HEIGHT' |

  // UI
  'UI_TRIGGER' |
  'SIMPLE_UI_SHOW' |
  'PLAY_UI_EFFECT' |
  'LUA_ACTION'
  ;

export type InterActionContextName =
  'ActivityChessPage' |
  'ActivityGachaForgingPage' |
  'ActivityMiniTomoItemDialog' |

  'AkaFesArchitectDungeonPage' |
  'AkaFesAstrolabeInLevelPage' |
  'AkaFesReasoningAddCorrectQuestNum' |
  'AkaFesReasoningClearCorrectQuestNum' |
  'AkaFesReasoningFinishLevel' |
  'AkaFesReasoningKeyword' |
  'AkaFesReasoningLevelFail' |
  'AkaFesReasoningLevel' |
  'AkaFesReasoningQuestion' |
  'AkaFesRhythmSelectLevel' |

  'BargainDialog' |
  'BlessingV2GiftSlideDialog' |
  'ChannellerSlabStagePageContext' |
  'ChapterBeginDialog' |

  'ChapterCompleteDialog' |
  'CharterRankingClose' |
  'CharterRankingFinal' |
  'CharterRankingTeam' |

  'CoopDefeatDialog' |
  'CoopItemAdsorbDialog' |
  'CoopPressureMax' |

  'DrawLotsPage' |
  'DuelHeartSelectDifficulty' |
  'FishblasterDetailedPage' |
  'FleurFairV2PhotoStagePageContext' |
  'ForceHideHandbookBtn' |
  'FungusV2DungeonEntryPage' |
  'GcgCardGroupName' |
  'GcgLevelPage' |
  'GivenDialog' |
  'GravenInnocenceActivityShopPage' |
  'HerculesBattleSelectPageContext' |
  'InLevelAvatarNamePageFirst' |
  'InLevelAvatarNamePage' |
  'InLevelPhotographContext' |

  'IrodoriChessEntryPage' |
  'IrodoriFlowerPopUpDialog' |
  'IrodoriMasterDifficultyDialog' |
  'IrodoriPoetryDialog' |
  'IrodoriPoetryPopUpDialog' |

  'JourneyDiceDungeonPage' |
  'JourneyGcgPickPage' |
  'LuminanceStonePage' |
  'MPHideandSeekPage' |

  'MusicCalibration' |
  'MusicDifficultyDialog' |
  'MusicInstrument' |
  'MusicV3SelectPageContext' |

  'PacmanChallengePage' |
  'PenAdvShuffleBoardLevelPage' |
  'PenAdvTargetShootingStagePage' |
  'PlotInferenceDialog' |
  'ProjectionGamePage' |

  'QuestEventItemFirstGetDialog' |
  'QuestEventsHandBookPageContext' |
  'QuestInferenceDialog' |
  'QuestPictureDialog' |
  'QuestProgressGuideDialog' |
  'QuestReadingDialog' |
  'QuestRefuteDialog' |
  'QuestTutorialDialog' |

  'RainbowPrinceHandbookActive' |
  'ResumeQuestRefuteDialog' |
  'SandWormCannonStartGallery' |
  'ShowCGDialog' |
  'ShowQuestEventHandbookNoSubmit' |
  'SynthesisPage' |

  'TalkCloseReminder' |
  'TalkItemClose' |
  'TalkItemShow' |
  'TalkShowReminder' |

  'TheatreMechanicusEntryPage' |
  'ToyBattleQteSelectPage' |
  'VintageCampChallengePage' |
  'VintageHunting' ;
// endregion

export const INTERACTION_KEEP_TYPES: Set<InterActionType> = new Set([
  'DIALOG',
  'DIALOG_SELECT',
  'DIALOG_CLEAR',
  'SIMPLE_BLACK_SCREEN',
  'BLACK_SCREEN',
  'CHANGE_TIME',
  'SHOW_BG_PIC',
  'CUTSCENE',
  // 'VIDEO_PLAY',
  'UI_TRIGGER',
  'FIRST_SIGHT',
]);

export const INTERACTION_INTERMEDIATE_TYPES: Set<InterActionType> = new Set([
  'SHOW_BG_PIC',
  'FIRST_SIGHT',
  'CUTSCENE',
  // 'VIDEO_PLAY',
  'UI_TRIGGER'
]);

export interface InterAction {
  Type: InterActionType,
  ActionId: number,

  // DIALOG/DIALOG_SELECT
  DialogId?: number, // SIMPLE_BLACK_SCREEN can also have this sometimes
  DialogIdList?: number[],
  GrpIdList?: number[],

  // VIDEO_PLAY (not supporting)
  // VideoName?: string,
  // SubtitleId?: number,

  // CUTSCENE:
  CutsceneIndex?: number,

  // SHOW_BG_PIC:
  PicPath?: string,
  Flag?: number, // 1 -> Boy, 2 -> Girl

  // FIRST_SIGHT/MISC:
  AliasList: string[],

  // UI_TRIGGER:
  ContextName: InterActionContextName,
  Param: number|string,
}

export interface InterActionGroup {
  Index: number,
  GroupId: number,
  NextGroupId?: number,
  NextGroupIdList?: number[],
  NoCircleNextGroupId?: number,
  PrevGroupIds?: number[],
  Actions: InterAction[]
}

export class InterActionFile {
  Name: string;
  /**
   * All the groups in the InterAction file
   */
  Groups: InterActionGroup[] = [];

  /**
   * Optional field for priority searching in findDialog() if there's a scenario where we assume a certain group is
   * most likely to contain the dialog being looked for.
   */
  Target: InterActionGroup = null;

  private GroupIdToGroup: {[groupId: number]: InterActionGroup} = {};

  constructor(name?: string, groups?: InterActionGroup[], target?: InterActionGroup) {
    this.Name = name || null;
    this.Groups = groups || [];
    this.Target = target || null;
    for (let group of this.Groups) {
      this.GroupIdToGroup[group.GroupId] = group;
    }
  }

  findGroup(groupId: number): InterActionGroup {
    return this.GroupIdToGroup[groupId];
  }

  private actionMatchesDialog(a: InterAction, dialogId: number) {
    return a.DialogId === dialogId || (a.DialogIdList && a.DialogIdList.includes(dialogId));
  }

  findFirstDialog(): InterActionDialog {
    for (let group of this.Groups) {
      for (let actionIndex = 0; actionIndex < group.Actions.length; actionIndex++){
        let action = group.Actions[actionIndex];
        if (!!action.DialogId) {
          return new InterActionDialog(this, group, action, actionIndex, action.DialogId);
        }
      }
    }
    return new InterActionDialog(this, null, null, null, null);
  }

  findDialog(dialogId: number): InterActionDialog {
    if (this.Target) {
      let actionIndex = this.Target.Actions.findIndex(a => this.actionMatchesDialog(a, dialogId));
      if (actionIndex >= 0) {
        return new InterActionDialog(this, this.Target, this.Target.Actions[actionIndex], actionIndex, dialogId);
      }
    }
    for (let group of this.Groups) {
      let actionIndex = group.Actions.findIndex(a => this.actionMatchesDialog(a, dialogId));
      if (actionIndex >= 0) {
        return new InterActionDialog(this, group, group.Actions[actionIndex], actionIndex, dialogId);
      }
    }
    return new InterActionDialog(this, null, null, null, dialogId);
  }
}

export interface InterActionNextDialogs {
  NextDialogs: number[];
  Intermediates: InterAction[];
}

export class InterActionDialog {
  File: InterActionFile;
  Group: InterActionGroup;
  Action: InterAction;
  ActionIndex: number;
  DialogId: number;

  constructor(File: InterActionFile, Group: InterActionGroup, Action: InterAction, ActionIndex: number, DialogId: number) {
    this.File = File;
    this.Group = Group;
    this.Action = Action;
    this.ActionIndex = ActionIndex;
    this.DialogId = DialogId;
  }

  isPresent(): boolean {
    return !!this.Group && !!this.Action;
  }

  isEmpty(): boolean {
    return !this.isPresent();
  }

  prev(enforcePriorIndexCandidatesOnly: boolean = false): number[] {
    if (this.isEmpty() || this.Group.Index === 0) {
      return [];
    }

    // If the group has multiple actions and this action is not the last one:
    if (this.Group.Actions.length > 1 && this.ActionIndex != (this.Group.Actions.length - 1)) {
      for (let i = this.ActionIndex - 1; i >= 0; i--) {
        let action = this.Group.Actions[i];
        if (!!action.DialogId) {
          return [action.DialogId];
        }
      }
    }

    let dialogIds: number[] = [];

    let paths: InterActionGroup[] = [this.Group];
    while (paths.length) {
      let group = paths.shift();

      if (!group.PrevGroupIds || !group.PrevGroupIds.length) {
        continue;
      }

      let prevGroups: InterActionGroup[] = group.PrevGroupIds.map(id => this.File.findGroup(id));

      for (let prevGroup of prevGroups) {
        if (enforcePriorIndexCandidatesOnly && prevGroup.Index > group.Index) {
          // The previous group should generally have a lesser index.
          // If not, then it's likely recursive dialogue.
          continue;
        }

        let pathEnd: boolean = false;
        for (let i = prevGroup.Actions.length - 1; i >= 0; i--) {
          let action = prevGroup.Actions[i];

          if (!!action.DialogId && action.DialogId !== this.DialogId) {
            pathEnd = true;
            dialogIds.push(action.DialogId);
          } else if (action.Type === 'DIALOG_SELECT') {
            pathEnd = true;
            let i = action.GrpIdList.indexOf(group.GroupId);
            dialogIds.push(action.DialogIdList[i]);
          }
          if (pathEnd) {
            break;
          }
        }
        if (!pathEnd) {
          paths.push(prevGroup);
        }
      }
    }
    return dialogIds;
  }

  next(): InterActionNextDialogs {
    if (!this.isPresent()) {
      return {NextDialogs: [], Intermediates: []};
    }

    let nextGroupId: number;
    let Intermediates: InterAction[] = [];

    if (this.Action.Type === 'DIALOG_SELECT') {
      const optIndex = this.Action.DialogIdList.indexOf(this.DialogId);
      nextGroupId = this.Action.GrpIdList[optIndex];
    } else if (this.Action.Type === 'DIALOG') {
      if (this.ActionIndex < this.Group.Actions.length - 1) { // if this is the second-to-last action or before
        for (let i = this.ActionIndex + 1; i < this.Group.Actions.length; i++) {
          let other = this.Group.Actions[i];
          if (other.Type === 'DIALOG') {
            return { NextDialogs: [other.DialogId], Intermediates };
          } else if (other.Type === 'DIALOG_SELECT') {
            return { NextDialogs: other.DialogIdList, Intermediates} ;
          } else if ((other.Type === 'SIMPLE_BLACK_SCREEN' || other.Type === 'BLACK_SCREEN' || other.Type === 'SHOW_BG_PIC') && other.DialogId) {
            return { NextDialogs: [other.DialogId], Intermediates };
          }
          if (INTERACTION_INTERMEDIATE_TYPES.has(other.Type)) {
            Intermediates.push(other);
          }
        }
      }
      nextGroupId = this.Group.NextGroupId;
    }

    while (nextGroupId) {
      const nextGroup = this.File.findGroup(nextGroupId);
      if (!nextGroup)
        break;

      for (let other of nextGroup.Actions) {
        if (other.Type === 'DIALOG') {
          return { NextDialogs: [other.DialogId], Intermediates };
        } else if (other.Type === 'DIALOG_SELECT') {
          return { NextDialogs: other.DialogIdList, Intermediates };
        } else if ((other.Type === 'SIMPLE_BLACK_SCREEN' || other.Type === 'BLACK_SCREEN' || other.Type === 'SHOW_BG_PIC') && other.DialogId) {
          return { NextDialogs: [other.DialogId], Intermediates };
        }
        if (INTERACTION_INTERMEDIATE_TYPES.has(other.Type)) {
          Intermediates.push(other);
        }
      }
      nextGroupId = nextGroup.NextGroupId;
    }

    return { NextDialogs: [], Intermediates };
  }
}
