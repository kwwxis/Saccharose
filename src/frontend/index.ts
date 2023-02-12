import '../shared/polyfills';
import './css/imports.scss';
import 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import 'tippy.js/themes/light-border.css';
import './initialListeners';
import './generalEventBus';

import './pages/basic/olgen';
import './pages/basic/text-map-expand';
import './pages/basic/id-usages';

import './pages/dialogue/branch_dialogue';
import './pages/dialogue/npc_dialogue';
import './pages/dialogue/quests';
import './pages/dialogue/reminders';
import './pages/dialogue/vo-to-dialogue';

import './pages/item/readables-search';

import './pages/character/vo-tool';

import { escapeHtml } from '../shared/util/stringUtil';
(<any> window).escapeHtml = escapeHtml;

import JSON5 from 'json5';
(<any> window).JSON5 = JSON5;