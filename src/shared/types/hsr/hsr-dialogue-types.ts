export interface DialogueCondition {
  Id: number,
  Param1: number,
  Param2: number,
  Type: 'eventmission_state_equal' | 'submission_state_equal',
}

export interface DialogueDynamicContent {
  ArgId: number,
  ContentText: string,
  ContentTextMapHash: number,
  DynamicContentId: number,
  DynamicParamList: number[],
  DynamicParamType: 'Append' | 'ReplaceAll' | 'ReplaceOne',
}

export type DialogueEventAeonOption = 'Abundance' | 'Destruction' | 'Elation' | 'Nihility' | 'Preservation' | 'Remembrance' | 'TheHunt';

export type DialogueEventCostType = 'CostHpCurrentPercent' | 'CostHpMaxPercent' | 'CostHpSpToPercent' | 'CostItemPercent' | 'CostItemValue';

export type DialogueEventEffectType =
  'ChangeChessRogueActionPoint'                   |
  'ChangeRogueMiracleToRogueBuff'                 |
  'ChangeRogueMiracleToRogueCoin'                 |
  'ChangeRogueMiracleToRogueMiracle'              |
  'DestroyRogueMiracle'                           |
  'FinishChessRogue'                              |
  'GetAllRogueBuffInGroup'                        |
  'GetChessRogueCheatDice'                        |
  'GetChessRogueRerollDice'                       |
  'GetItem'                                       |
  'GetItemByPercent'                              |
  'GetRogueBuff'                                  |
  'GetRogueMiracle'                               |
  'RecoverLineup'                                 |
  'RemoveRogueBuff'                               |
  'RemoveRogueMiracle'                            |
  'RepairRogueMiracleByGroup'                     |
  'ReplaceRogueBuff'                              |
  'ReplaceRogueBuffKeepLevel'                     |
  'SetChessRogueNextStartCellAdventureRoomType'   |
  'TriggerBattle'                                 |
  'TriggerDialogueEventList'                      |
  'TriggerRandomEvent'                            |
  'TriggerRandomResult'                           |
  'TriggerRogueBuffDrop'                          |
  'TriggerRogueBuffReforge'                       |
  'TriggerRogueBuffSelect'                        |
  'TriggerRogueMiracleSelect'                     |
  'TriggerRogueMiracleTrade'                      |
  'UpRogueBuffLevel'                              ;

export interface DialogueEvent {
  AeonOption?: DialogueEventAeonOption,
  ConditionIdList: number[],
  CostParamList: number[],
  CostType?: DialogueEventCostType,
  DescValueTextMapHash: number,
  DynamicContentId: number,
  EffectParamList: number[],
  EffectType?: DialogueEventEffectType,
  EventDisplayId: number,
  EventId: number,
  PerformanceType: number,
}

export interface DialogueEventDisplay {
  EventDescText: string,
  EventDescTextMapHash: number,
  EventDetailDescTextMapHash: number,
  EventDisplayId: number,
  EventTitleText: string,
  EventTitleTextMapHash: number,
}

export type DialogueIconType =
  'BoxIcon'               |
  'ChatBackIcon'          |
  'ChatContinueIcon'      |
  'ChatIcon'              |
  'ChatLoopIcon'          |
  'ChatMissionIcon'       |
  'ChatOutIcon'           |
  'CheckIcon'             |
  'CommonSign'            |
  'Default'               |
  'FightActivity'         |
  'GeneralActivityIcon'   |
  'HealHPIcon'            |
  'HideIcon'              |
  'LevelIcon'             |
  'MonsterReasearchIcon'  |
  'RogueHeita'            |
  'SecretMissionIcon'     |
  'ShopIcon'              |
  'SpecialChatIcon'       |
  'StandupIcon'           |
  'Synthesis'             |
  'TriggerProp'           ;

export interface DialogueIcon {
  IconPath: string,
  Type: DialogueIconType,
}

export type DialogueNPCGroupType = 'Free' | 'Simple';
export type DialogueNPCIconType = 'ChatContinueIcon' | 'ChatIcon' | 'ChatMissionIcon' | 'ChatOutIcon' | 'LevelIcon' | 'ShopIcon';

export interface DialogueNPC {
  ActPath: string,
  ConditionIds: number[],
  GroupId: number,
  GroupType: DialogueNPCGroupType,
  IconType: DialogueNPCIconType,
  InteractTitleText: string,
  InteractTitleTextMapHash: number,
  Priority: number,
}

export type DialoguePropGroupType = 'Free' | 'Simple';
export type DialoguePropIconType = 'ChatContinueIcon' | 'ChatIcon' | 'ChatMissionIcon' | 'ChatOutIcon' | 'CheckIcon' | 'LevelIcon' | 'ShopIcon';

export interface DialogueProp {
  ActPath: string,
  ConditionIds: number[],
  GroupId: number,
  GroupType: DialoguePropGroupType,
  IconType: DialoguePropIconType,
  InteractTitleText: string,
  InteractTitleTextMapHash: number,
  Priority: number,
}

export interface RogueNPCDialogue {
  DialoguePath: string,
  DialogueProgress: number,
  HandbookEventId: number,
  RogueNPCId: number,
  TexturePath: string,
}