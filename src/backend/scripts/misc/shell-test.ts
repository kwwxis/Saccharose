import '../../loadenv';
import { grepIdStartsWith, grepStream } from '../../util/shellutil';
import { pathToFileURL } from 'url';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    // let allQuestMessageIds = await grepIdStartsWith('TextMapId', 'QUEST_Message_Q', './ExcelBinOutput/ManualTextMapConfigData.json');
    // console.log(allQuestMessageIds);


    let exitCode = await grepStream('TextMapId', './ExcelBinOutput/ManualTextMapConfigData.json', null);
    console.log('Exit Code:', exitCode);
  })();
}