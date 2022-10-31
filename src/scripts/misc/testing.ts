import '../../setup';
import {Control, getControl} from "../script_util";
import { closeKnex } from '@db';

if (require.main === module) {
  (async () => {
    let ctrl: Control = getControl();

    await ctrl.selectTalkExcelConfigDataByNpcId(12345);

    closeKnex();
  })();
}