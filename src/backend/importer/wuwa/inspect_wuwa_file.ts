import { pathToFileURL } from 'url';
import { closeKnex } from '../../util/db.ts';
import { inspectDataFile, InspectOpt } from '../util/inspect_file_util.ts';
import { getGenshinControl } from '../../domain/genshin/genshinControl.ts';
import { getWuwaControl } from '../../domain/wuwa/wuwaControl.ts';

const excel = (file: string) => `./ConfigDB/${file}.json`;

const presets = {
  RoleInfo: <InspectOpt> { file: excel('RoleInfo'), inspectFieldValues: ['QualityId', 'RoleType', 'RoleBody'] },

  // region Favors
  FavorGoods: <InspectOpt> { file: excel('FavorGoods'), inspectFieldValues: ['Type'] },
  FavorRoleInfo: <InspectOpt> { file: excel('FavorRoleInfo'), inspectFieldValues: [] },
  FavorStory: <InspectOpt> { file: excel('FavorStory'), inspectFieldValues: [] },
  FavorWord: <InspectOpt> { file: excel('FavorWord'), inspectFieldValues: ['Type'] },
  // endregion


  // region Conditions
  ConditionGroup: <InspectOpt> { file: excel('ConditionGroup'), inspectFieldValues: ['Relation'] },
  Condition: <InspectOpt> { file: excel('Condition'), inspectFieldValues: ['Type', 'NeedNum', 'LimitParams[#ALL].Key', 'LimitParamsOpe[#ALL].Value'] },
  // endregion
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ctrl = getWuwaControl();
  ctrl.state.AutoloadRoleInfo = false;
  ctrl.state.AutoloadConditions = false;

  await inspectDataFile(ctrl, presets.FavorWord);

  await closeKnex();
}
