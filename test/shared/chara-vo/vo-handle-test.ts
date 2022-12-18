import util from 'util';
import { loadResourceAsString } from '../../spec-util';
import { createVoHandle } from '../../../src/shared/vo-tool/vo-handle';

if (require.main === module) {
  (async () => {
    const wikitext = loadResourceAsString('Nahida_EN_VO.wt');
    const handle = createVoHandle(wikitext).compile();

    console.log('\n\n\n\n');
    console.log(util.inspect(handle.groups, false, 5, true));
  })();
}