import { GenshinControl } from '../../domain/genshin/genshinControl.ts';
import {
  InterActionDialog,
  InterActionFile,
  InterActionNextDialogs,
} from '../../../shared/types/genshin/interaction-types.ts';


const ctrl: GenshinControl = GenshinControl.noDbConnectInstance();
const iaFile: InterActionFile = await ctrl.loadInterActionFileByDialogId(711670102);
const iaDialog: InterActionDialog = iaFile.findDialog(711670102);
const iaNextDialogs: InterActionNextDialogs = iaDialog.next();
console.log(iaNextDialogs);
