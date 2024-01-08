<template>
  <meta name="x-pageid" :content="meta_pageid" />
  <meta name="x-page" :content="JSON.stringify(page)" />
  <section class="card" v-if="!has_pageid">
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
  <section class="card" v-if="has_pageid">
    <h2 class="valign">
      <span><strong>{{ page.pageid }}:</strong> {{ page.title }}</span>
      <span class="grow"></span>
      <a :href="openPageInWikiLink" target="_blank" role="button" class="secondary small dispBlock valign">
        <span class="spacer5-right">Open article in wiki</span>
        <Icon name="external-link" :size="12" />
      </a>
      <a href="/revs" role="button" class="spacer5-left secondary small dispBlock">Back to article search</a>
    </h2>
    <div class="tab-list" role="tablist">
      <button role="tab" id="tab-revHome" class="tab active" ui-action="tab: #tabpanel-revHome, revMainTabs">Rev List</button>
      <button role="tab" id="tab-revSelect" class="tab hide" ui-action="tab: #tabpanel-revSelect, revMainTabs">Rev #<span class="curr-rev-id"></span></button>
    </div>
    <div id="tabpanel-revHome" role="tabpanel" class="tabpanel active" aria-labelledby="tab-revHome">
      <div class="content valign">
        <span class="loading x24"></span>
        <span class="loading-label spacer15-left">Posting script job, please wait...</span>
      </div>
    </div>
    <div id="tabpanel-revSelect" role="tabpanel" aria-labelledby="tab-revSelect" class="tabpanel hide">
      <h3 class="secondary-header">Revision #<span class="curr-rev-id"></span></h3>
      <div id="rev-props"></div>
      <div class="tab-list secondary" role="tablist">
        <button id="tab-revDiff" role="tab" class="tab active" ui-action="tab: #tabpanel-revDiff, revSelectTabs">Rev Diff</button>
        <button id="tab-revContent" role="tab" class="tab" ui-action="tab: #tabpanel-revContent, revSelectTabs">Rev Content</button>
        <button id="tab-revPrevContent" role="tab" class="tab" ui-action="tab: #tabpanel-revPrevContent, revSelectTabs">Prev Content</button>
      </div>
      <div id="tabpanel-revDiff" role="tabpanel" aria-labelledby="tab-revDiff" class="tabpanel active">
        <div class="content">
          <p class="info-notice">Diff from the previous revision to this revision.</p>
        </div>
        <div id="rev-diff"></div>
      </div>
      <div id="tabpanel-revContent" role="tabpanel" aria-labelledby="tab-revContent" class="tabpanel hide">
        <div class="content">
          <p class="info-notice">Content of this revision with ownership segments. Hover over text to show segments or select a user in the contributors list.</p>
          <fieldset>
            <legend>Contributors list</legend>
            <div class="content">
              <p class="spacer5-bottom">List of users who have contributions in this revision.
                If a user had previously contributed to this page, but no longer have any contributions in this revision, then they won't be show in this list.</p>
              <div id="rev-contributors"></div>
            </div>
          </fieldset>
        </div>
        <div id="rev-content"></div>
      </div>
      <div id="tabpanel-revPrevContent" role="tabpanel" aria-labelledby="tab-revPrevContent" class="tabpanel hide">
        <div class="content">
          <p class="info-notice">Content of the previous revision (#<span class="prev-rev-id"></span>). Segments are not shown in this view.</p>
        </div>
        <div id="rev-prev-content"></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import Icon from '../utility/Icon.vue';
import { isInt } from '../../../shared/util/numberUtil.ts';
import { MwArticleInfo } from '../../../shared/mediawiki/mwTypes.ts';
import { getTrace } from '../../middleware/request/tracer.ts';
import { toParam } from '../../../shared/util/stringUtil.ts';

const {pageid, page} = defineProps<{
  pageid?: number,
  page?: MwArticleInfo,
}>();

const has_pageid: boolean = isInt(pageid);
const meta_pageid: string = isInt(pageid) ? String(pageid) : '';

const { ctx } = getTrace();
const openPageInWikiLink = has_pageid ? `https://${ctx.siteModeWikiDomain}/wiki/${toParam(page.title)}` : null;
</script>
