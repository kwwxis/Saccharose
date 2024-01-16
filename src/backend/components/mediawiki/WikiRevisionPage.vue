<template>
  <meta name="x-pageid" :content="meta_pageid" />
  <meta name="x-revid" :content="meta_revid" />
  <meta name="x-page" :content="JSON.stringify(page)" />
  <section id="revApp-articleSearch" class="card" v-if="!has_pageid">
    <h2>Wiki Revisions</h2>
    <div class="content form-box">
      <div class="field valign">
        <div class="posRel valign grow">
          <input class="search-input grow" type="text" placeholder="Search by page title or page ID" style="border-radius:3px 0 0 3px" />
          <button class="search-input-paste input-paste-button"><Icon name="clipboard" /></button>
          <button class="search-input-clear input-clear-button hide"><Icon name="x-circle" /></button>
        </div>
        <button class="search-submit primary primary--2 spacer10-left">Search</button>
        <div class="search-submit-pending visHide loading small spacer5-left"></div>
      </div>
    </div>
    <div id="search-result" class="content hide"></div>
  </section>
  <div id="revApp-wrapper" class="alignStart" v-if="has_pageid">
    <section id="revApp-side" class="card sidebar no-shrink out">
      <h2>Rev List Preview</h2>
      <div id="revApp-sideContent" class="content" data-overlayscrollbars-initialize></div>
    </section>
    <section id="revApp-main" class="card disable-wikitext-linker grow">
      <h2 class="valign">
        <span><strong>{{ page.pageid }}:</strong> {{ page.title }}</span>
        <span class="grow"></span>
        <a :href="openPageInWikiLink" target="_blank" role="button" class="secondary small dispBlock valign">
          <span class="spacer5-right">Open article in wiki</span>
          <Icon name="external-link" :size="12" />
        </a>
        <a href="/revs" role="button" class="spacer5-left secondary small dispBlock">Back to article search</a>
      </h2>
      <div id="tablist-revMainTabs" class="tab-list" role="tablist">
        <div class="alignEnd">
          <button role="tab" id="tab-revHome" class="tab active no-shrink" ui-action="tab: #tabpanel-revHome, revMainTabs">Rev List</button>
          <div id="revTabWheel" class="alignEnd grow" data-overlayscrollbars-initialize>
            <div id="revTabWheelInner" class="alignEnd"></div>
          </div>
        </div>
      </div>
      <div id="tabpanel-revHome" role="tabpanel" class="tabpanel active"></div>
      <div id="tabpanel-revSelect" role="tabpanel" class="tabpanel hide">
        <h3 class="secondary-header">Revision #<span class="curr-rev-id"></span></h3>
        <div id="rev-props" style="min-height:107.5px"></div>
        <div id="tablist-revSelectTabs" class="tab-list secondary" role="tablist">
          <button id="tab-revDiff" role="tab" class="tab" ui-action="tab: #tabpanel-revDiff, revSelectTabs">Rev Diff</button>
          <button id="tab-revContent" role="tab" class="tab" ui-action="tab: #tabpanel-revContent, revSelectTabs">Rev Content</button>
          <button id="tab-revPrevContent" role="tab" class="tab" ui-action="tab: #tabpanel-revPrevContent, revSelectTabs">Prev Content</button>
        </div>
        <div id="tabpanel-revDiff" role="tabpanel" aria-labelledby="tab-revDiff" class="tabpanel hide">
          <div id="rev-diff-header"></div>
          <div id="rev-diff"></div>
        </div>
        <div id="tabpanel-revContent" role="tabpanel" aria-labelledby="tab-revContent" class="tabpanel hide">
          <div id="rev-content-header"></div>
          <div id="rev-content"></div>
        </div>
        <div id="tabpanel-revPrevContent" role="tabpanel" aria-labelledby="tab-revPrevContent" class="tabpanel hide">
          <div id="rev-prevContent-header"></div>
          <div id="rev-prevContent"></div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import Icon from '../utility/Icon.vue';
import { isInt } from '../../../shared/util/numberUtil.ts';
import { MwArticleInfo } from '../../../shared/mediawiki/mwTypes.ts';
import { getTrace } from '../../middleware/request/tracer.ts';
import { toParam } from '../../../shared/util/stringUtil.ts';

const {pageid, page, revid} = defineProps<{
  pageid?: number,
  revid?: number,
  page?: MwArticleInfo,
}>();

const has_pageid: boolean = isInt(pageid);
const has_revid: boolean = isInt(revid);

const meta_pageid: string = has_pageid ? String(pageid) : '';
const meta_revid: string = has_revid ? String(revid) : '';

const { ctx } = getTrace();
const openPageInWikiLink = has_pageid ? `https://${ctx.siteModeWikiDomain}/wiki/${toParam(page.title)}` : null;
</script>
