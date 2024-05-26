import '../../../loadenv.ts';
import { StarRailControl } from '../starRailControl.ts';
import { MainMission, SubMission } from '../../../../shared/types/hsr/hsr-mission-types.ts';


export async function doHsrDialogueWalk(ctrl: StarRailControl) {
  let mainMissonExcel: MainMission[] = await ctrl.readExcelDataFile('MainMission.json');
  let subMissionExcel: SubMission[] = await ctrl.readExcelDataFile('SubMission.json');

  const mainMission = mainMissonExcel.find(m => m.Id === 1000201);

  console.log(mainMission);
}
