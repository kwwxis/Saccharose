import { SchemaTable } from '../../../backend/importer/import_db';

export const InterActionSchema = <SchemaTable>{
  name: 'InterAction',
  columns: [],
  jsonFile: '',
  renameFields: {
    MLAABINGLAA: 'DialogOptions',
    HPBPDBFGKID: 'DialogNextGroup',
    KICBIOMGHIN: 'DialogId',
    LMHLEOPOLEK: 'CutsceneId'
  },
};

export type InterActionD2F = {[id: number]: [string, number, number]};

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
  'FIRST_SIGHT' |
  'REQUEST_MSG' |
  'BAN_SELF_GLOBAL_VALUE' |
  'EMOJI_BUBBLE' |
  'SPEECH_BUBBLE' |
  'SHOP_EXCHANGE' |
  'PLAY_EFFECT' |

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

export const INTERACTION_KEEP_TYPES: Set<InterActionType> = new Set([
  'DIALOG',
  'DIALOG_SELECT',
  'DIALOG_CLEAR',
  'SIMPLE_BLACK_SCREEN',
  'BLACK_SCREEN',
  'CHANGE_TIME',
  'SHOW_BG_PIC',
  'CUTSCENE',
  'VIDEO_PLAY'
])

export interface InterAction {
  Type: InterActionType,
  ActionId: number,

  // DIALOG/DIALOG_SELECT
  DialogId?: number,
  DialogOptions?: number[],
  DialogNextGroup?: number[],

  // VIDEO_PLAY
  VideoName?: string,
  SubtitleId?: number,

  // Cutscene:
  CutsceneId?: number,

  // SHOW_BG_PIC:
  PicPath?: string,
}

export interface InterActionGroup {
  Index: number,
  GroupId: number,
  NextGroupId?: number,
  Actions: InterAction[]
}

export class InterActionFile {
  Groups: InterActionGroup[] = [];
  Target: InterActionGroup = null;

  constructor(groups?: InterActionGroup[], target?: InterActionGroup) {
    this.Groups = groups || [];
    this.Target = target || null;
  }

  findForDialog(dialogueId: number): InterAction {
    if (this.Target) {
      let ia = this.Target.Actions.find(a => a.DialogId === dialogueId);
      if (ia)
        return ia;
    }
    for (let group of this.Groups) {
      let ia = group.Actions.find(a => a.DialogId === dialogueId);
      if (ia)
        return ia;
    }
    return null;
  }
}