import '../../loadenv';
import path from 'path';
import fs, { promises as fsp } from 'fs';
import { pathToFileURL } from 'url';
import { getGenshinDataFilePath } from '../../loadenv';
import { normalizeRawJson, SchemaTable } from '../import_db';

// region Walk Sync
// --------------------------------------------------------------------------------------------------------------
function* walkSync(dir: string): Generator<string> {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}
// endregion

// region Types
// --------------------------------------------------------------------------------------------------------------
const InterActionSchema = <SchemaTable>{
  name: 'InterAction',
  columns: [],
  jsonFile: '',
  renameFields: {
    CIOBDALMHGN: 'DialogOptions',
    MCAHMAIKDKH: 'DialogNextGroup',
    GBAPKLGILDP: 'DialogId',
    EDFJOBOJFBD: 'CutsceneId'
  },
};

type InterActionType =
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

const KEEP_TYPES: Set<InterActionType> = new Set([
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

interface InterAction {
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

interface InterActionGroup {
  Index: number,
  GroupId: number,
  NextGroupId?: number,
  Actions: InterAction[]
}
// endregion

// region Main Function
// --------------------------------------------------------------------------------------------------------------
const allTypes: Set<string> = new Set();
const d2f: {[id: number]: string} = {};

export async function loadInterActionQD(repoRoot: string) {
  const binOutputPath: string = path.resolve(repoRoot, './BinOutput');
  const excelDirPath: string = path.resolve(repoRoot, './ExcelBinOutput');

  if (!fs.existsSync(binOutputPath)) throw new Error('BinOutput path does not exist!');
  if (!fs.existsSync(excelDirPath)) throw new Error('ExcelBinOutput path does not exist!');

  const binOutputIAQD: string = path.resolve(binOutputPath, './InterAction/QuestDialogue');

  if (!fs.existsSync(binOutputIAQD)) throw new Error('BinOutput/InterAction/QuestDialogue path does not exist!');

  const outDir = path.resolve(repoRoot, './InterAction');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir);

  for (let fileName of walkSync(binOutputIAQD)) {
    if (!fileName.endsWith('.json')) {
      continue;
    }

    const json = await fsp.readFile(fileName, { encoding: 'utf8' }).then(data => JSON.parse(data));

    let basename = path.basename(fileName);
    let outFile = path.resolve(outDir, basename);
    let dupe = 2;
    while (fs.existsSync(outFile)) {
      basename = basename.replace('.json', `_${dupe++}.json`);
      outFile = path.resolve(outDir, basename);
    }

    const groups = processJsonObject(basename, json);
    if (!groups) {
      continue;
    }

    fs.writeFileSync(outFile, JSON.stringify(groups, null, 2));
  }

  fs.writeFileSync(path.resolve(repoRoot, './InterActionD2F.json'), JSON.stringify(d2f, null, 2));
  console.log('Done');
}


function processInterAction(fileName: string, a: any): InterAction {
  let action: InterAction = normalizeRawJson(a, InterActionSchema);
  allTypes.add(action.Type);
  if (action.Type === 'DIALOG') {
    if (typeof action.DialogId === 'number') {
      d2f[action.DialogId] = fileName;
    } else {
      return null;
    }
  } else if (action.Type === 'DIALOG_SELECT') {
    if (Array.isArray(action.DialogOptions)) {
      for (let dialogOption of action.DialogOptions) {
        d2f[dialogOption] = fileName;
      }
    } else {
      return null;
    }
  }
  return action;
}

function processJsonObject(fileName: string, json: any): InterActionGroup[] {
  if (!json || !Array.isArray(json.group) || !Array.isArray(json.groupId)) {
    return;
  }

  let groups: InterActionGroup[] = [];

  for (let i = 0; i < json.group.length; i++) {
    let _actions: any[] = json.group[i];
    let actions: InterAction[] = [];
    for (let _action of _actions) {
      let action = processInterAction(fileName, _action);
      if (action) {
        actions.push(action);
      }
    }

    let groupId: any = json.groupId[i];
    let group: InterActionGroup = {
      Index: groupId.index || 0,
      GroupId: groupId.grpId,
      NextGroupId: groupId.nextGrpId,
      Actions: actions,
    }
    groups.push(group);
  }

  return groups;
}

// region CLI
// --------------------------------------------------------------------------------------------------------------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadInterActionQD(getGenshinDataFilePath());
}