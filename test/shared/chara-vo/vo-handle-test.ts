import util from 'util';
import { loadResourceAsString } from '../../spec-util';
import { createVoHandle } from '../../../src/shared/vo-tool/vo-handle';
import { pathToFileURL } from 'url'
import { resolveObjectPath } from '../../../src/shared/util/arrayUtil';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const wikitext = loadResourceAsString('Nahida_EN_VO.wt');
    const handle = createVoHandle(wikitext).compile();

    console.log('\n\n\n\n');

    resolveObjectPath(handle, 'groups[#all].handle', true);
    resolveObjectPath(handle, 'groups[#all].items[#all].handle', true);
    resolveObjectPath(handle, 'groups[#all].items[#all].group', true);
    resolveObjectPath(handle, 'groups[#all].title.handle', true);
    resolveObjectPath(handle, 'groups[#all].title.group', true);

    console.log(util.inspect(handle.groups, false, 5, true));
  })();
}