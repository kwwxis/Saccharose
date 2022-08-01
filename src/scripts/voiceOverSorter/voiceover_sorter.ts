import '../../setup';
import fs from 'fs';
import {normalizeName, normalizeCharName, normNameMap} from '@/scripts/script_util';

type VOLine = {
  charName: string,
  voLine: string,
}

function createVOLine(voLine: string): VOLine {
  voLine = voLine.trim();
  if (voLine.length == 0) {
    return null;
  }
  if (voLine.startsWith('*')) {
    voLine = voLine.slice(1).trim();
  }
  let voLineParts = voLine.split(/[\s_]+/g);
  if (voLine.endsWith('|1}}')) {
    voLine = voLine.slice(0,-4) + '}}';
  }
  let charNameRaw;
  if (voLineParts[2] === 'mimitomo') { // teapot VO
    charNameRaw = voLineParts[1].trim().toLowerCase();
  } else if (voLineParts[1] === 'tips') {
    charNameRaw = voLineParts[4].trim().toLowerCase();
  } else if (voLineParts[3].trim() === 'cs') { // cutscene VO
    charNameRaw = voLineParts[4].trim().toLowerCase();
  } else { // normal VO
    charNameRaw = voLineParts[3].trim().toLowerCase();
  }
  return {
    voLine,
    charName: normalizeCharName(charNameRaw)
  };
}

function createVOMap(voLines: string[]): Record<string, VOLine[]> {
  const voMap: Record<string, VOLine[]> = {};

  voLines.map(s => createVOLine(s)).forEach(voLine => {
    if (!voLine) {
      return;
    }
    if (!voMap.hasOwnProperty(voLine.charName)) {
      voMap[voLine.charName] = [];
    }
    voMap[voLine.charName].push(voLine);
  });

  return voMap;
}

type DialogueLine = {
  indentPart: string,
  charName: string,
  lineWithoutIndent: string,
}

function dialogueLine(line: string): DialogueLine {
  line = line.replace(/^(:+)\s+'''/g, `$1'''`);

  let idx = line.indexOf(`:'''`);
  if (idx === -1) {
    return null;
  }
  let indentPart = line.slice(0, idx);
  if (':'.repeat(indentPart.length) !== indentPart) {
    return null;
  }
  indentPart = indentPart + ':';

  return {
    indentPart,
    lineWithoutIndent: line.slice(indentPart.length),
    charName: normalizeCharName(line.split(`'''`)[1])
  };
}

export function dialogueVoSort(dialogueText: string, voText: string): {out: string[], voMap: Record<string, VOLine[]>, warnings: string[]} {
  const out: string[] = [];
  const warnings: string[] = [];

  if (dialogueText.includes('???:')) {
    warnings.push('Warning: dialogue text contains a "???" character line.');
  }

  const voLines: string[] = voText.split(/\r?\n/);
  const voMap: Record<string, VOLine[]> = createVOMap(voLines);

  const dialogueLines: string[] = dialogueText.split(/\r?\n/);
  const seenDialogueMap: Record<string, VOLine> = {};
  const seenDialogueMapEnabled = false;

  let inSkipMode = false;

  for (let line of dialogueLines) {
    let charOverride;
    let doubleVoLine: boolean = false;

    if (line.startsWith('#char[')) {
      let parts = line.slice(6).split(/\](.+)/);
      line = parts[1].trim();
      charOverride = normalizeCharName(parts[0].trim());
    }
    if (line.startsWith('#double ')) {
      line = line.slice('#double '.length);
      doubleVoLine = true;
    }

    const info = dialogueLine(line);

    if (charOverride && info) {
      info.charName = charOverride;
    }

    if (line.startsWith('#chardefine ')) {
      let parts = line.slice('#chardefine '.length).split('=');
      normNameMap[normalizeName(parts[0])] = normalizeName(parts[1]);
      continue;
    }
    if (line.startsWith('#chardef ')) {
      let parts = line.slice('#chardef '.length).split('=');
      normNameMap[normalizeName(parts[0])] = normalizeName(parts[1]);
      continue;
    }
    if (line.startsWith('#skip start')) {
      inSkipMode = true;
      continue;
    }
    if (line.startsWith('#skip end')) {
      inSkipMode = false;
      continue;
    }
    if (line.startsWith('#skip ')) {
      out.push(line.slice(6));
      continue;
    }
    if (inSkipMode) {
      out.push(line);
      continue;
    }

    if (!!info && !!info.charName && voMap.hasOwnProperty(info.charName)) {
      let voLine: VOLine = null;

      if (seenDialogueMapEnabled && seenDialogueMap.hasOwnProperty(info.lineWithoutIndent)) {
        voLine = seenDialogueMap[info.lineWithoutIndent];
      } else {
        voLine = voMap[info.charName].shift();
        if (voLine)
          seenDialogueMap[info.lineWithoutIndent] = voLine;
      }

      if (voLine) {
        let voPart = voLine.voLine;

        if (voLine.voLine.includes('a.ogg') && voMap[info.charName].length && voMap[info.charName][0].voLine.includes('b.ogg') &&
            (doubleVoLine || /\([^/]+\/[^)]+\)/.test(info.lineWithoutIndent) || /\(Traveler\)/i.test(info.lineWithoutIndent))) {
          let nextVoLine = voMap[info.charName].shift();
          voPart += ' ' + nextVoLine.voLine;
        }

        out.push(info.indentPart + voPart + ' ' + info.lineWithoutIndent);
        continue;
      }
    }

    out.push(line);
  }

  return {out, voMap, warnings};
}


function voSorter() {
  let dialogueText = fs.readFileSync('C:/Shared/git/localweb/genshin-data-explorer/script-io/input/voSort_dialogueIn.wt','utf8');
  let voText = fs.readFileSync('C:/Shared/git/localweb/genshin-data-explorer/script-io/input/voSort_voiceover.txt','utf8');
  let {out, voMap, warnings} = dialogueVoSort(dialogueText, voText);

  console.log(out.join('\n'));
  console.log(voMap);
  console.log(warnings.join('\n'));

  let leftoverVOs = Object.values(voMap).flat().map(v => '* '+v.voLine.slice(0,-2) + '|1}}').join('\n');

  fs.writeFileSync('C:/Shared/git/localweb/genshin-data-explorer/script-io/dist/voSort_dialogueOut.wt', out.join('\n') + (leftoverVOs.length ? '\n\n===Unsorted Voice-Overs===\n' + leftoverVOs : ''));
}

if (require.main === module) {
  voSorter();
}