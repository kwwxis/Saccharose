import { GCGControl } from './gcg_control';

export interface TCGStageDto {

}

export async function generateCardList(control: GCGControl) {

}

export async function generateStageList(control: GCGControl) {

}


export async function generateCardPage(control: GCGControl) {

}

export async function generateStagePage(control: GCGControl, stageId: number) {
  const stage = await control.selectStage(stageId);
}