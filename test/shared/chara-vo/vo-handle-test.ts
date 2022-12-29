import util from 'util';
import { loadResourceAsString } from '../../spec-util';
import { createVoHandle } from '../../../src/shared/vo-tool/vo-handle';
import { pathToFileURL } from 'url'

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const wikitext = loadResourceAsString('Nahida_EN_VO.wt');
    const handle = createVoHandle(wikitext).compile();

    console.log('\n\n\n\n');
    console.log(util.inspect(handle.groups, false, 5, true));
  })();
}