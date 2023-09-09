import { pageMatch } from '../../../pageMatch';
import { initializeVoTool } from '../../generic/vo-tool/vo-tool';

pageMatch('pages/hsr/character/vo-tool', () => {
  initializeVoTool();
});