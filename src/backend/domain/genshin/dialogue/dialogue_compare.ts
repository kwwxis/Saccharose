import { Marker } from '../../../../shared/util/highlightMarker.ts';
import { defaultMap } from '../../../../shared/util/genericUtil.ts';
import { sort } from '../../../../shared/util/arrayUtil.ts';
import { DialogueSectionResult } from '../../../util/dialogueSectionResult.ts';

export type SimilarityGroups = {[groupId: number]: {sectionId: string, sectionTitle: string}[]};

const fastThreshold: number = 0.3;

export function dialogueCompareApply(sections: DialogueSectionResult[]): SimilarityGroups {
  const flatList: DialogueSectionResult[] = [];

  let stack = [... sections];
  while (stack.length) {
    let sect = stack.shift();
    flatList.push(sect);
    if (sect.children.length) {
      stack.push(... sect.children);
    }
  }

  const alreadyChecked: Set<string> = new Set<string>();

  for (let sect1 of flatList) {
    if (!sect1.wikitext) {
      continue;
    }
    for (let sect2 of flatList) {
      if (sect1 === sect2 || !sect2.wikitext) {
        continue;
      }

      const checkId1: string = sect1.id + '_' + sect2.id;
      const checkId2: string = sect2.id + '_' + sect1.id;
      if (alreadyChecked.has(checkId1) || alreadyChecked.has(checkId2)) {
        continue;
      } else {
        alreadyChecked.add(checkId1);
        alreadyChecked.add(checkId2);
      }

      const lines1: string[] = sect1.wikitext.split('\n');
      const lines2: string[] = sect2.wikitext.split('\n');

      const lines1_set: Set<string> = new Set<string>(lines1);
      const lines2_set: Set<string> = new Set<string>(lines2);

      const numLinesSame: number = lines1.filter(line => lines2_set.has(line)).length;

      if ((numLinesSame / lines1.length) <= fastThreshold) {
        continue;
      }

      sect1.getOrCreateHeaderProp('Similar Sections').addValues(sect2.id, '#{}');
      sect2.getOrCreateHeaderProp('Similar Sections').addValues(sect1.id, '#{}');

      for (let i = 0; i < lines1.length; i++) {
        if (!lines2_set.has(lines1[i])) {
          sect1.wikitextMarkers.push(Marker.fullLine('highlight-blue', i + 1))
        }
      }

      for (let i = 0; i < lines2.length; i++) {
        if (!lines1_set.has(lines2[i])) {
          sect2.wikitextMarkers.push(Marker.fullLine('highlight-blue', i + 1))
        }
      }
    }
  }


  let nextGroupId = 1;
  const groupIdAcc: {[similarCombinedIds: string]: number} = defaultMap(() => nextGroupId++);
  const groups: SimilarityGroups = {};

  for (let sect of flatList) {
    const prop = sect.getHeaderProp('Similar Sections');
    if (!prop) {
      continue;
    }

    sort(prop.values, 'value');

    const propValues = prop.values.map(x => x.value);
    propValues.push(sect.id);
    propValues.sort();

    const similarCombinedIds = propValues.join('|');
    const groupId = groupIdAcc[similarCombinedIds];
    sect.similarityGroupId = groupId;

    if (!groups[groupId]) {
      groups[groupId] = propValues.map(sectionId => ({
        sectionId,
        sectionTitle: flatList.find(flatSect => flatSect.id === sectionId)?.title,
      }));
    }
  }

  return groups;
}
