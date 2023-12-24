import '../shared/polyfills.ts';
import './css/imports.scss';
import 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import 'tippy.js/themes/light-border.css';
import './siteMode.ts';
import './initialListeners.ts';
import './generalEventBus.ts';
import './pages/generic/basic/olgen.ts';
import './pages/generic/basic/textmap.ts';
import './pages/generic/basic/id-usages.ts';
import './pages/generic/excel-viewer/excel-viewer.ts';
import './pages/genshin/dialogue/branch_dialogue.ts';
import './pages/genshin/dialogue/npc_dialogue.ts';
import './pages/genshin/dialogue/quests.ts';
import './pages/genshin/dialogue/reminders.ts';
import './pages/genshin/dialogue/vo-to-dialogue.ts';
import './pages/genshin/archive/achievements-search.ts';
import './pages/genshin/archive/readables-search.ts';
import './pages/genshin/archive/material-search.ts';
import './pages/genshin/archive/weapon-search.ts';
import './pages/genshin/archive/furniture-list.ts';
import './pages/genshin/archive/tutorials-search.ts';
import './pages/genshin/character/genshin-vo-tool.ts';
import './pages/genshin/media/media-search.page.ts';
import './pages/hsr/character/hsr-vo-tool.ts';
import { escapeHtml } from '../shared/util/stringUtil.ts';
(<any> window).escapeHtml = escapeHtml;

import JSON5 from 'json5';
(<any> window).JSON5 = JSON5;

import { resolveObjectPath } from '../shared/util/arrayUtil.ts';
(<any> window).resolveObjectPath = resolveObjectPath;

import { mwParse } from '../shared/mediawiki/mwParse.ts';
(<any> window).mwParse = mwParse;

import { uuidv4 } from '../shared/util/uuidv4.ts';
(<any> window).uuidv4 = uuidv4;