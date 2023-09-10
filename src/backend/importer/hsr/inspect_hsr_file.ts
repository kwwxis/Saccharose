import { pathToFileURL } from 'url';
import { closeKnex } from '../../util/db';
import { inspectDataFile, InspectOpt } from '../util/inspect_file_util';
import { getStarRailControl } from '../../domain/hsr/starRailControl';

const excel = (file: string) => `./ExcelOutput/${file}.json`;

const presets = {
  // region Mission:
  DailyMissionCount: <InspectOpt> { file: excel('DailyMissionCount'), inspectFieldValues: [] },
  DailyMissionData: <InspectOpt> { file: excel('DailyMissionData'), inspectFieldValues: [] },
  EventMission: <InspectOpt> { file: excel('EventMission'), inspectFieldValues: ['Type', 'TakeType'] },
  EventMissionChallenge: <InspectOpt> { file: excel('EventMissionChallenge'), inspectFieldValues: [] },
  FinishWayEventMission: <InspectOpt> { file: excel('FinishWayEventMission'), inspectFieldValues: ['ParamType', 'FinishType'] },
  MainMission: <InspectOpt> { file: excel('MainMission'), inspectFieldValues: ['Type', 'TakeOperation', 'BeginOperation', 'BeginParam[#ALL].Type', 'TakeParam[#ALL].Type', 'AudioEmotionState'] },
  MainMissionSchedule: <InspectOpt> { file: excel('MainMissionSchedule'), inspectFieldValues: [] },
  MainMissionType: <InspectOpt> { file: excel('MainMissionType'), inspectFieldValues: [] },
  MissionChapterConfig: <InspectOpt> { file: excel('MissionChapterConfig'), inspectFieldValues: [] },
  ScheduleDataMission: <InspectOpt> { file: excel('ScheduleDataMission'), inspectFieldValues: [] },
  SubMission: <InspectOpt> { file: excel('SubMission'), inspectFieldValues: [] },
  // endregion
  // region Messages:
  MessageContactsCamp: <InspectOpt> { file: excel('MessageContactsCamp'), inspectFieldValues: [] },
  MessageContactsCondition: <InspectOpt> { file: excel('MessageContactsCondition'), inspectFieldValues: [] },
  MessageContactsConfig: <InspectOpt> { file: excel('MessageContactsConfig'), inspectFieldValues: [] },
  MessageContactsType: <InspectOpt> { file: excel('MessageContactsType'), inspectFieldValues: [] },
  MessageGroupConfig: <InspectOpt> { file: excel('MessageGroupConfig'), inspectFieldValues: [] },
  MessageItemConfig: <InspectOpt> { file: excel('MessageItemConfig'), inspectFieldValues: ['ItemType', 'Sender'] },
  MessageItemImage: <InspectOpt> { file: excel('MessageItemImage'), inspectFieldValues: [] },
  MessageItemRaidEntrance: <InspectOpt> { file: excel('MessageItemRaidEntrance'), inspectFieldValues: [] },
  MessageSectionConfig: <InspectOpt> { file: excel('MessageSectionConfig'), inspectFieldValues: [] },
  MessageStateIcon: <InspectOpt> { file: excel('MessageStateIcon'), inspectFieldValues: [] },
  // endregion
  // region Dialogue:
  DialogueCondition: <InspectOpt> { file: excel('DialogueCondition'), inspectFieldValues: ['Type'] },
  DialogueDynamicContent: <InspectOpt> { file: excel('DialogueDynamicContent'), inspectFieldValues: ['DynamicParamType'] },
  DialogueEvent: <InspectOpt> { file: excel('DialogueEvent'), inspectFieldValues: ['AeonOption', 'CostType', 'EffectType'] },
  DialogueEventDisplay: <InspectOpt> { file: excel('DialogueEventDisplay'), inspectFieldValues: [] },
  DialogueIcon: <InspectOpt> { file: excel('DialogueIcon'), inspectFieldValues: ['Type'] },
  DialogueNPC: <InspectOpt> { file: excel('DialogueNPC'), inspectFieldValues: ['GroupType', 'IconType'] },
  DialogueProp: <InspectOpt> { file: excel('DialogueProp'), inspectFieldValues: ['GroupType', 'IconType'] },
  RogueNPCDialogue: <InspectOpt> { file: excel('RogueNPCDialogue'), inspectFieldValues: [] },
  // endregion
  // region Talk:
  TalkBehavior: <InspectOpt> { file: excel('TalkBehavior'), inspectFieldValues: ['ParaType'] },
  TalkReward: <InspectOpt> { file: excel('TalkReward'), inspectFieldValues: [] },
  TalkSentenceConfig: <InspectOpt> { file: excel('TalkSentenceConfig'), inspectFieldValues: [] },
  TalkSentenceMultiVoice: <InspectOpt> { file: excel('TalkSentenceMultiVoice'), inspectFieldValues: [] },
  TutorialGuideTalkData: <InspectOpt> { file: excel('TutorialGuideTalkData'), inspectFieldValues: [] },
  VoiceConfig: <InspectOpt> { file: excel('VoiceConfig'), inspectFieldValues: ['VoiceType'] },
  // endregion
  // region Misc:
  AvatarConfig: <InspectOpt> { file: excel('AvatarConfig'), inspectFieldValues: ['BaseType', 'DamageType', 'Rarity'] },
  AvatarVO: <InspectOpt> { file: excel('AvatarVO'), inspectFieldValues: [] },
  AvatarBaseType: <InspectOpt> { file: excel('AvatarBaseType'), inspectFieldValues: [] },
  VoiceAtlas: <InspectOpt> { file: excel('VoiceAtlas'), inspectFieldValues: [] },
  AtlasUnlockData: <InspectOpt> { file: excel('AtlasUnlockData'), inspectFieldValues: ['Conditions[#ALL].Type'] },
  LoadingDesc: <InspectOpt> { file: excel('LoadingDesc'), inspectFieldValues: [] },
  RewardData: <InspectOpt> { file: excel('RewardData'), inspectFieldValues: [] },
  // endregion
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const ctrl = getStarRailControl();

    await inspectDataFile(ctrl, presets.AvatarConfig);

    await closeKnex();
  })();
}