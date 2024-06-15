import { pathToFileURL } from 'url';
import { closeKnex } from '../../util/db.ts';
import { inspectDataFile, InspectOpt } from '../util/inspect_file_util.ts';
import { getGenshinControl } from '../../domain/genshin/genshinControl.ts';
import { getWuwaControl } from '../../domain/wuwa/wuwaControl.ts';


const excel = (file: string) => `./ConfigDB/${file}.json`;

const presets = {
  // region Misc:
  RoleInfo: <InspectOpt> { file: excel('RoleInfo'), inspectFieldValues: ['QualityId', 'RoleType', 'RoleBody'] },
  FavorGoods: <InspectOpt> { file: excel('FavorGoods'), inspectFieldValues: [] },
  FavorRoleInfo: <InspectOpt> { file: excel('FavorRoleInfo'), inspectFieldValues: [] },
  FavorStory: <InspectOpt> { file: excel('FavorStory'), inspectFieldValues: [] },
  FavorWord: <InspectOpt> { file: excel('FavorWord'), inspectFieldValues: [] },
  // endregion
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    getGenshinControl();
    const ctrl = getWuwaControl();

    await inspectDataFile(ctrl, presets.FavorGoods);

    await closeKnex();
  })();
}
