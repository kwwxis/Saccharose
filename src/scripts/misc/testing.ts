import '../../setup';
import {Control, getControl, grep, normText} from "../script_util";
import {promises as fs} from 'fs';
import config from '@/config';
import { getTextMapItem, loadEnglishTextMap } from '../textmap';
import { closeKnex } from '@db';
import SrtParser, { SrtLine } from '../../util/srtParser';

if (require.main === module) {
  (async () => {
    let ctrl: Control = getControl();

    let questId = 1031;

    let fileNames: string[] = await fs.readdir(config.database.getGenshinDataFilePath('./Subtitle/'+ctrl.outputLangCode));

    let targetFileNames: string[] = [];
    for (let fileName of fileNames) {
      if (fileName.includes(`Q${questId}`)) {
        if (fileName.endsWith('.txt') && targetFileNames.includes(fileName.slice(0, -4)+'.srt')) {
          // If targetFileNames already contains the .srt version of the .txt file, then skip
          continue;
        }
        targetFileNames.push(fileName);
      }
    }

    let inputs: {[genderlessFileName: string]: string[]} = {};
    for (let targetFileName of targetFileNames) {
      let genderlessFileName = targetFileName.replace('_Boy', '').replace('_Girl', '');
      if (!inputs.hasOwnProperty(genderlessFileName)) {
        inputs[genderlessFileName] = [];
      }
      inputs[genderlessFileName].push(targetFileName);
    }

    let parser = new SrtParser();
    let srtMap: {[fileNane: string]: SrtLine[]} = {};

    for (let inputKey of Object.keys(inputs)) {
      let input = inputs[inputKey];
      let filePath1: string = config.database.getGenshinDataFilePath('./Subtitle/'+ctrl.outputLangCode+'/'+input[0]);
      let fileData1: string = await fs.readFile(filePath1, {encoding: 'utf8'});

      let srt1: SrtLine[] = parser.fromSrt(fileData1);
      let srt2: SrtLine[] = [];

      if (input.length > 1) {
        let filePath2: string = config.database.getGenshinDataFilePath('./Subtitle/'+ctrl.outputLangCode+'/'+input[1]);
        let fileData2: string = await fs.readFile(filePath2, {encoding: 'utf8'});
        srt2 = parser.fromSrt(fileData2);
      }

      let allMatch = true;
      if (srt1.length === srt2.length) {
        for (let i = 0; i < srt1.length; i++) {
          let line1 = srt1[i];
          let line2 = srt2[i];
          if (line1.text === line2.text) {
            continue;
          } else {
            allMatch = false;
          }
        }
      }

      if (!allMatch) {
        srtMap[input[0]] = srt1;
        if (input.length > 1) {
          srtMap[input[1]] = srt2;
        }
      } else {
        srtMap[inputKey] = srt1;
      }
    }

    let formattedResults: {[fileName: string]: string} = {};
    for (let srtFile of Object.keys(srtMap)) {
      let srtLines = srtMap[srtFile];
      let out = [];
      out.push(';(A cinematic plays)');
      for (let srtLine of srtLines) {
        out.push(`::'''CS_CHAR:''' ` + normText(srtLine.text));
      }
      out.push(':;(Cinematic ends)');
      formattedResults[srtFile] = out.join('\n');
    }

    console.log(formattedResults);

    closeKnex();
  })();
}