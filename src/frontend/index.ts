// Polyfills & CSS
// ----------------------------------------------------------------------------------------------------
import '../shared/polyfills.ts';
import './css/imports.scss';

// Tippy
// ----------------------------------------------------------------------------------------------------
import 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import 'tippy.js/themes/light-border.css';

// Core
// ----------------------------------------------------------------------------------------------------
import './core/pageMatch.ts';
import './core/userPreferences/siteMode.ts';
import './core/siteEvents.ts';
import './core/generalEventBus.ts';

// Generic Pages
// ----------------------------------------------------------------------------------------------------
import './pages/generic/basic/olgen.ts';
import './pages/generic/basic/textmap.ts';
import './pages/generic/basic/id-usages.ts';
import './pages/generic/excel-viewer/excel-viewer.ts';
import './pages/generic/wiki-revs/WikiRevisions.page.ts';
import './pages/generic/basic/VueTest.page.ts';

// Genshin Dialogue Pages
// ----------------------------------------------------------------------------------------------------
import './pages/genshin/dialogue/branch_dialogue.ts';
import './pages/genshin/dialogue/npc_dialogue.ts';
import './pages/genshin/dialogue/quests.ts';
import './pages/genshin/dialogue/reminders.ts';
import './pages/genshin/dialogue/vo-to-dialogue.ts';

// Genshin Archive Pages
// ----------------------------------------------------------------------------------------------------
import './pages/genshin/archive/achievements-search.ts';
import './pages/genshin/archive/readables-search.ts';
import './pages/genshin/archive/material-search.ts';
import './pages/genshin/archive/weapon-search.ts';
import './pages/genshin/archive/furniture-list.ts';
import './pages/genshin/archive/tutorials-search.ts';

// Genshin VO Tool and Media Pages
// ----------------------------------------------------------------------------------------------------
import './pages/genshin/character/genshin-vo-tool.ts';
import './pages/genshin/media/media-search.page.ts';

// HSR VO Tool
// ----------------------------------------------------------------------------------------------------
import './pages/hsr/character/hsr-vo-tool.ts';

// Expose certain functions to global scope for debugging purposes
// ----------------------------------------------------------------------------------------------------
import { escapeHtml } from '../shared/util/stringUtil.ts';

(<any> window).escapeHtml = escapeHtml;

import JSON5 from 'json5';

(<any> window).JSON5 = JSON5;

import { resolveObjectPath } from '../shared/util/arrayUtil.ts';

(<any> window).resolveObjectPath = resolveObjectPath;

import { walkObjectGen } from '../shared/util/arrayUtil.ts';

(<any> window).walkObject = walkObjectGen;

import { isEquiv } from '../shared/util/arrayUtil.ts';

(<any> window).isEquiv = isEquiv;

import { mwParse } from '../shared/mediawiki/mwParse.ts';

(<any> window).mwParse = mwParse;

import { uuidv4, NIL_UUID, MAX_UUID } from '../shared/util/uuidv4.ts';

(<any> window).uuidv4 = uuidv4;
(<any> window).NIL_UUID = NIL_UUID;
(<any> window).MAX_UUID = MAX_UUID;

import { getElementOffset } from './util/domutil.ts';

(<any> window).getElementOffset = getElementOffset;
