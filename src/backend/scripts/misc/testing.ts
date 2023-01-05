import '../../loadenv';
import {Control, getControl, normText} from "../script_util";
import { pathToFileURL } from 'url';
import { loadEnglishTextMap } from '../textmap';
import util from 'util';
import { closeKnex } from '../../util/db';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadEnglishTextMap();

  const ctrl = getControl();

  let res = await ctrl.selectReadableArchiveView();
  console.log(util.inspect(res, false, null, true));

  await closeKnex();
}