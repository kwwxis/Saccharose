import { pathToFileURL } from 'url';
import { getGenshinControl, loadGenshinVoiceItems } from '../genshinControl';
import { defaultMap } from '../../../../shared/util/genericUtil';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadGenshinVoiceItems();

  const ctrl = getGenshinControl();
  const items = ctrl.voice.getVoiceItemsByType('Dialog');

  const group: {[cat1: string]: {[cat2: string]: Set<string>}} = defaultMap(() => defaultMap('Set'));
  const all: {[cat2: string]: Set<string>} = defaultMap('Set');

  for (let item of items) {
    if (!item.fileName.startsWith('vo card')) {
      continue;
    }

    const split = item.fileName.split(' ');
    group[split[2]][split[3]].add(split[4]);
    all[split[3]].add(split[4]);
  }

  console.inspect(group);
  console.log('--------')
  console.inspect(all);
}