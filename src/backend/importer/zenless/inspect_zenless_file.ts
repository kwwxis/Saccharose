import { pathToFileURL } from 'url';
import { closeKnex } from '../../util/db.ts';
import { inspectDataFile, InspectOpt } from '../util/inspect_file_util.ts';
import { getZenlessControl } from '../../domain/zenless/zenlessControl.ts';
import { DialogueNode } from '../../../shared/types/zenless/dialogue-types.ts';

const excel = (file: string) => `./FileCfg/${file}.json`;

const presets = {
  DialogueNodeTemplateTb: <InspectOpt> {
    file: excel('DialogueNodeTemplateTb'),
    inspectFieldValues: ['NodeMark'],
    preNormFilter: (d: DialogueNode) => (d.NodeType === 20)
  },
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ctrl = getZenlessControl();

  await inspectDataFile(ctrl, presets.DialogueNodeTemplateTb);

  await closeKnex();
}
