<template>
  <div id="vo-tool-outer">
    <div id="vo-tool-sidebar" class="card">
      <h2 class="valign">
        <span>{{ avatarLabel }} VO Tool</span>
        <span class="grow"></span>
        <button id="vo-tool-sidebar-mobile-toggle" class="secondary" ui-action="toggle-class: #vo-tool-sidebar, mobile; toggle-class: body, disable-scroll">
          <span class="toggle-show-text">Show {{ avatarLabel }} List</span>
          <span class="toggle-hide-text">Hide {{ avatarLabel }} List</span>
        </button>
      </h2>
      <div id="vo-tool-sidebar-search" class="content">
        <div class="field">
          <div class="posRel">
            <input id="vo-toolbar-sidebar-search" type="text" class="w100p"
                   :placeholder="`Search ${ avatarLabelPlural.toLowerCase() }...`" />
            <span id="vo-toolbar-sidebar-search-pending" class="loading small posAbs hide" style="right:10px;top:0;bottom:0;margin:auto"></span>
          </div>
        </div>
      </div>
      <div id="vo-tool-sidebar-list" class="content" data-overlayscrollbars-initialize>
        <a role="button" class="secondary dispFlex textAlignLeft" :href="`${ctx.siteHome}${pageUrl}`">
          <span class="icon framed valign halign"><Icon name="home" /></span>
          <span class="spacer10-left">VO Tool Home</span>
        </a>
        <a v-for="avatar of avatars"
           :id="`vo-toolbar-sidebar-avatar-${avatar.Id}`"
           :data-name="normText(avatar.NameText)"
           class="vo-toolbar-sidebar-avatar secondary dispFlex textAlignLeft"
           :href="`${ctx.siteHome}${pageUrl}/${toParam(normText(avatar.NameText))}`"
           role="button">
          <img class="icon x28" :src="`${avatar.ImagePathPrefix}${avatar.IconName}.png`" loading="lazy" decoding="async" />
          <span class="spacer10-left">{{ normText(avatar.NameText) }}</span>
        </a>
      </div>
    </div>
    <HtmlScript :nonce="ctx.nonce" :content="`
      window.voLangCode = '${voLangCode}';
      window.voLangName = '${voLangName}';
    `" />
    <HtmlScript :nonce="ctx.nonce" :content="`window.avatars = ${JSON.stringify(avatars)};`" />
    <template v-if="avatar">
      <HtmlScript :nonce="ctx.nonce" :content="`window.avatar = ${JSON.stringify(avatar)};`" />
    </template>
    <template v-else>
      <HtmlScript :nonce="ctx.nonce" :content="`window.avatar = null;`" />
    </template>
    <component is="template" id="template-icon-drag-handle"><Icon name="drag-handle" /></component>
    <component is="template" id="template-icon-add"><Icon name="plus" /></component>
    <component is="template" id="template-icon-trash"><Icon name="trash-2" /></component>
    <component is="template" id="template-icon-chevron-up"><Icon name="chevron-up" /></component>
    <component is="template" id="template-icon-chevron-down"><Icon name="chevron-down" /></component>
    <div id="vo-app">
      <div v-if="!avatar" id="vo-app-welcome">
        <div class="card">
          <h2>Welcome to the {{ avatarLabel }} VO app</h2>
          <div class="content" style="max-width:800px">
            <p>To get started, select a {{ avatarLabel.toLowerCase() }} in the left-hand sidebar.</p>
            <div id="vo-app-welcome-recent">
              <hr class="spacer15-vert" />
              <p class="spacer5-bottom">{{ avatarLabelPlural }} you have saved local data for:</p>
              <div id="vo-app-welcome-recent-list" class="alignStart flexWrap">
                <p class="valign spacer5-left">
                  <span class="loading"></span>
                  <span class="spacer5-left">Checking saved local data...</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div id="vo-app-welcome-notice" class="card hide">
          <h2>Notice</h2>
          <div id="vo-app-welcome-notice-content" class="content" style="max-width:800px">
          </div>
        </div>
        <div class="card">
          <h2>Start from wikitext</h2>
          <div class="content" style="max-width:800px">
            <p>
              Or if you have an existing VO template, you can paste it below, and it'll identify the {{ avatarLabel.toLowerCase() }}
              from the template parameters.</p>
            <p>You can also paste the entire article, and it'll find the correct template.</p>
          </div>
          <div>
            <hr />
            <div id="welcome-wt-input" style="width:100%;height:40vh"></div>
            <hr />
          </div>
          <div class="content">
            <div class="buttons valign">
              <button id="welcome-wt-submit" class="primary">Go!</button>
            </div>
          </div>
        </div>
      </div>
      <template v-else>
        <div id="vo-app-toolbar" class="card alignStretch spacer15-bottom">
          <div id="vo-app-toolbar-avatarName" class="valign secondary-label">
            <img class="icon x32" :src="`${avatar.ImagePathPrefix}${avatar.IconName}.png`" loading="lazy" decoding="async" />
            <strong>{{ normText(avatar.NameText) }}</strong>
          </div>
          <div id="vo-app-toolbar-content" class="valign flexWrap justifySpaceBetween grow">
            <div class="vo-app-toolbar-buttons valign flexWrap">
              <div class="vo-app-toolbar-button valign spacer10-left posRel">
                <button id="vo-app-load-button" class="secondary border-light" ui-action="dropdown: #vo-app-load-dropdown">
                  <span class="spacer5-right">Load</span>
                  <Icon name="chevron-down" />
                </button>
                <div id="vo-app-load-dropdown" class="ui-dropdown">
                  <div id="vo-app-load-fromWikitext" class="option" ui-action="dropdown-item">Load from wikitext</div>
                  <div class="option-sep"></div>
                  <div id="vo-app-load-from-story" class="option" ui-action="dropdown-item">Load from story voice-overs</div>
                  <div id="vo-app-load-from-combat" class="option" ui-action="dropdown-item">Load from combat voice-overs</div>
                </div>
              </div>
              <div class="vo-app-toolbar-button valign spacer10-left posRel">
                <button id="vo-app-export-button" class="secondary border-light" ui-action="dropdown: #vo-app-export-dropdown">
                  <span class="spacer5-right">Export</span>
                  <Icon name="chevron-down" />
                </button>
                <div id="vo-app-export-dropdown" class="ui-dropdown">
                  <div id="vo-app-export-copyText" class="option" ui-action="dropdown-item">Copy Wikitext</div>
                  <div id="vo-app-export-saveFile" class="option" ui-action="dropdown-item">Save Wikitext to file</div>
                  <div class="option-sep"></div>
                  <div id="vo-app-export-json" class="option" ui-action="dropdown-item">Export voice-overs JSON to file</div>
                </div>
              </div>
              <div class="vo-app-toolbar-button valign spacer10-left posRel">
                <button id="vo-app-language-button" class="secondary border-light" ui-action="dropdown: #vo-app-language-dropdown">
                  <b>VO Language:&nbsp;</b>
                  <span id="vo-app-language-current" class="spacer5-right current-option">{{ voLangName }}</span>
                  <Icon name="chevron-down" />
                </button>
                <div id="vo-app-language-dropdown" class="ui-dropdown">
                  <div class="vo-app-language-option option"
                       :class="{selected: ternary(voLangCode).equals('EN').or.isEmpty().get()}"
                       ui-action="dropdown-item" data-value="EN">English</div>
                  <div class="vo-app-language-option option"
                       :class="{selected: ternary(voLangCode).equals('CH').get()}"
                       ui-action="dropdown-item" data-value="CH">Chinese</div>
                  <div class="vo-app-language-option option"
                       :class="{selected: ternary(voLangCode).equals('JP').get()}"
                       ui-action="dropdown-item" data-value="JP">Japanese</div>
                  <div class="vo-app-language-option option"
                       :class="{selected: ternary(voLangCode).equals('KR').get()}"
                       ui-action="dropdown-item" data-value="KR">Korean</div>
                </div>
              </div>

              <div class="vo-app-toolbar-button valign spacer10-left posRel" data-control="outputLangCode" ui-tippy="Same as &quot;Output Language&quot;">
                <button id="vo-app-interfacelang-button" class="secondary border-light" ui-action="dropdown: #vo-app-interfacelang-dropdown">
                  <b>Interface Language:&nbsp;</b>
                  <span id="vo-app-interfacelang-current" class="spacer5-right current-option"
                        :data-value="ctx.outputLangCode">
                    {{ ctx.languages[ctx.outputLangCode] }}
                  </span>
                  <Icon name="chevron-down" />
                </button>
                <div id="vo-app-interfacelang-dropdown" class="ui-dropdown">
                  <template v-for="langCode of Object.keys(ctx.languages)">
                    <div :class="`vo-app-interfacelang-option option ${ctx.outputLangCode === langCode ? 'selected' : ''}`"
                         ui-action="dropdown-item" :data-value="langCode">{{ ctx.languages[langCode] }}</div>
                  </template>
                </div>
              </div>
            </div>
            <div class="vo-app-toolbar-buttons valign">
              <div id="vo-app-loading-status" class="valign">
                <div class="loading x18"></div>
                <div class="loading-label spacer5-left">Loading voice-overs...</div>
              </div>
            </div>
          </div>
        </div>

        <div class="tab-list" role="tablist">
          <button role="tab"
                  id="tab-visual"
                  class="tab"
                  :class="{active: tab === 'visual'}"
                  ui-action="tab: #tabpanel-visual, voAppTabs; set-query-param: tab=visual; remove-class: body, tab--wikitext; add-class: body, tab--visual">Visual Editor</button>
          <button role="tab"
                  id="tab-wikitext"
                  class="tab"
                  :class="{active: tab === 'wikitext'}"
                  ui-action="tab: #tabpanel-wikitext, voAppTabs; set-query-param: tab=wikitext; remove-class: body, tab--visual; add-class: body, tab--wikitext">Wikitext Editor</button>
        </div>
        <div id="vo-app-visualEditorReloadError-story" class="card hide" style="margin-bottom:1px">
          <div class="content"></div>
        </div>
        <div id="vo-app-visualEditorReloadError-combat" class="card hide" style="margin-bottom:1px">
          <div class="content"></div>
        </div>
        <div role="tabpanel"
             aria-labelledby="tab-visual"
             class="tabpanel"
             :class="{active: tab === 'visual', hide: tab !== 'visual'}"
             id="tabpanel-visual">
          <div class="card" id="vo-editor">
            <h2>Story Groups</h2>
            <div class="content">
              <div id="vo-story-groups" class="vo-handle-area"></div>
            </div>
            <h2>Combat Groups</h2>
            <div class="content">
              <div id="vo-combat-groups" class="vo-handle-area"></div>
            </div>
          </div>
        </div>
        <div role="tabpanel"
             aria-labelledby="tab-wikitext"
             :class="{active: tab === 'wikitext', hide: tab !== 'wikitext'}"
             id="tabpanel-wikitext">
          <div class="card">
            <div class="content valign" style="padding:5px;">
              <p class="info-notice grow spacer10-right" style="font-size:14px;line-height:14px">
                Any changes made here will be automatically reflected in the visual editor, and vice-versa.
              </p>
              <button id="wikitext-reformat-button" class="secondary">Reformat</button>
            </div>
            <div>
              <hr />
              <div id="wikitext-editor"></div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LangCode } from '../../../shared/types/lang-types.js';
import { NormTextOptions } from '../../domain/abstract/genericNormalizers.js';
import { CommonAvatar } from '../../../shared/types/common-types.js';
import Icon from '../utility/Icon.vue';
import { getTrace } from '../../middleware/request/tracer.js';
import { toParam } from '../../../shared/util/stringUtil.js';
import HtmlScript from '../utility/HtmlScript.vue';
import { ternary } from '../../../shared/util/genericUtil.ts';

const { ctx } = getTrace();

defineProps<{
  avatars: CommonAvatar[],
  avatar: CommonAvatar,
  avatarLabel: string,
  avatarLabelPlural: string,
  pageUrl: string,
  tab: 'visual' | 'wikitext',
  normText: (text: string, langCode: LangCode, opts?: NormTextOptions) => string,
  appSidebarOverlayScroll: boolean,
  voLangCode: LangCode,
  voLangName: string,
}>();
</script>
