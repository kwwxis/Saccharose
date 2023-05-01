import util from 'util';
import { loadResourceAsString } from '../../../spec-util';
import { createVoHandle } from '../../../../src/frontend/pages/genshin/character/vo-handle';
import { pathToFileURL } from 'url'
import { resolveObjectPath } from '../../../../src/shared/util/arrayUtil';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    process.on('unhandledRejection', (err) => console.error('UnhandledRejection!', err));

    const wikitext = loadResourceAsString('Nahida_EN_VO.wt');
    const handle = createVoHandle(wikitext).compile();
    for (let i = 0; i < 20; i++) {
      console.log('\n');
    }

    let weatherGroup = handle.group('03');
    weatherGroup.moveTo(handle.groups.length);
    weatherGroup.item('04').remove();

    let helloGroup = handle.group('01');
    helloGroup.remove();
    helloGroup.moveTo(1);

    let greetingGroup = handle.group('03');
    greetingGroup.moveTo(0);

    let chatGroup = handle.group('02');
    chatGroup.item('01').moveTo(0);
    chatGroup.item('01').setParam('rm', 'foobar');
    chatGroup.item('01').setParam('subtitle', 'lorem ipsum');
    chatGroup.item('01').setParam('unknown', 'heck');

    let myGroup = handle.newGroup();
    myGroup.title.text = 'Hello World!';
    let newItem = myGroup.newItem();
    newItem.setParam('title', 'About the wiki');
    newItem.setParam('tx', 'I think the wiki is pretty okay.');
    weatherGroup.item('04').moveTo(1, myGroup);
    weatherGroup.item('03').moveTo(0, myGroup);

    let newWikitext = handle.templateNode.toString();

    // resolveObjectPath(handle, 'groups[#all].handle', true);
    // resolveObjectPath(handle, 'groups[#all].items[#all].handle', true);
    // resolveObjectPath(handle, 'groups[#all].items[#all].group', true);
    // resolveObjectPath(handle, 'groups[#all].title.handle', true);
    // resolveObjectPath(handle, 'groups[#all].title.group', true);
    // console.log(util.inspect(handle.groups, false, 5, true));

    console.log(newWikitext);
  })();
}