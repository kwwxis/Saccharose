import { pathToFileURL } from 'url';
import { closeKnex } from '../../util/db.ts';
import { inspectDataFile, InspectOpt } from '../util/inspect_file_util.ts';
import { getZenlessControl } from '../../domain/zenless/zenlessControl.ts';
import { DialogueNode } from '../../../shared/types/zenless/dialogue-types.ts';

const excel = (file: string) => `./FileCfg/${file}.json`;

const presets = {
  DialogueNodeTemplateTb: <InspectOpt> {
    file: excel('DialogueNodeTemplateTb'),
    inspectFieldValues: ['NodeType'],
    preNormFilter: (d: DialogueNode) => d.NodeType === 1
  },
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ctrl = getZenlessControl();

  await inspectDataFile(ctrl, {
    file: excel('DialogueNodeTemplateTb'),
    inspectFieldValues: ['NodeType'],
    preNormFilter: (d: DialogueNode) => d.NodeType === 29
  });

  await closeKnex();
}
