import { AvatarExcelConfigData } from './general-types';

export interface GCGTalkDetailExcelConfigData {
  TalkDetailId: number,
  SpeakerId?: number,
  Avatar?: AvatarExcelConfigData,
  Text: string
  TextMapHash: number,
  VoPrefix?: string,
}