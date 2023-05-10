import '../shared/polyfills';
import './css/imports.scss';
import 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import 'tippy.js/themes/light-border.css';
import './initialListeners';
import './generalEventBus';

import './pages/generic/basic/olgen';
import './pages/generic/basic/textmap';
import './pages/generic/basic/id-usages';
import './pages/generic/basic/asi-test';
import './pages/generic/basic/excel-viewer';

import './pages/genshin/dialogue/branch_dialogue';
import './pages/genshin/dialogue/npc_dialogue';
import './pages/genshin/dialogue/quests';
import './pages/genshin/dialogue/reminders';
import './pages/genshin/dialogue/vo-to-dialogue';

import './pages/genshin/archive/readables-search';
import './pages/genshin/archive/material-search';
import './pages/genshin/archive/weapon-search';

import './pages/genshin/character/vo-tool';

import { escapeHtml } from '../shared/util/stringUtil';
(<any> window).escapeHtml = escapeHtml;

import JSON5 from 'json5';
(<any> window).JSON5 = JSON5;

import { resolveObjectPath } from '../shared/util/arrayUtil';
(<any> window).resolveObjectPath = resolveObjectPath;