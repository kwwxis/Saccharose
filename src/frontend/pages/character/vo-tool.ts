import { createApp } from 'vue';
import { pageMatch } from '../../pageMatch';
import App from './vo-app/VoApp.vue';
import './vo-common.scss';

pageMatch('pages/character/vo-tool', () => {
  createApp(App).mount('#vo-tool-app')
});