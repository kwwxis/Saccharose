import { pageMatch } from '../../../pageMatch';
import { initializeVoTool } from '../../generic/vo-tool/vo-tool';

pageMatch('pages/genshin/character/vo-tool', () => {
  initializeVoTool();
});