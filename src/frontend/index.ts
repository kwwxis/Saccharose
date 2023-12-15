import '../shared/polyfills';
import './css/imports.scss';
import 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import 'tippy.js/themes/light-border.css';
import './siteMode';
import './initialListeners';
import './generalEventBus';

import './pages/generic/basic/olgen';
import './pages/generic/basic/textmap';
import './pages/generic/basic/id-usages';
import './pages/generic/excel-viewer/excel-viewer';

import './pages/genshin/dialogue/branch_dialogue';
import './pages/genshin/dialogue/npc_dialogue';
import './pages/genshin/dialogue/quests';
import './pages/genshin/dialogue/reminders';
import './pages/genshin/dialogue/vo-to-dialogue';

import './pages/genshin/archive/achievements-search';
import './pages/genshin/archive/readables-search';
import './pages/genshin/archive/material-search';
import './pages/genshin/archive/weapon-search';
import './pages/genshin/archive/furniture-list';
import './pages/genshin/archive/tutorials-search';

import './pages/genshin/character/genshin-vo-tool';
import './pages/genshin/media/media-search.page';

import './pages/hsr/character/hsr-vo-tool';

import { escapeHtml } from '../shared/util/stringUtil';
(<any> window).escapeHtml = escapeHtml;

import JSON5 from 'json5';
(<any> window).JSON5 = JSON5;

import { resolveObjectPath } from '../shared/util/arrayUtil';
(<any> window).resolveObjectPath = resolveObjectPath;

import { mwParse } from '../shared/mediawiki/mwParse';
(<any> window).mwParse = mwParse;

import { uuidv4 } from '../shared/util/uuidv4';
(<any> window).uuidv4 = uuidv4;