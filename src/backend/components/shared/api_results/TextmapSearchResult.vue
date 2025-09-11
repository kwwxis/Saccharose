<template>
  <div class="card result-count-card">
    <h2 class="valign">
      <div class="valign">
        <span>Page&nbsp;</span>
        <span>{{ resultSetIdx + 1 }}</span>
        <span style="margin:0 8px">&mdash;</span>
        <span>{{ items.length }}</span>
        <span>&nbsp;{{ items.length > 1 ? 'items' : 'item' }}</span>
      </div>
      <div class="grow"></div>
      <div class="valign">
        <small class="load-more-status" style="opacity:0.8">{{ hasMoreResults ? 'Load more results at bottom' : 'All results loaded' }}</small>
      </div>
    </h2>
  </div>
  <div class="result-wrapper"
       :data-continue-from-line="continueFromLine"
       :data-page="resultSetIdx + 1"
       :data-result-set-idx="resultSetIdx">
    <section v-for="(item, i) of items" :data-hash="item.hash" class="card">
      <h2 class="valign" style="font-size: 16px;padding: 3px 10px;">
        <span style="opacity:0.6">TextMapHash:&nbsp;</span>
        <code readonly class="code no-input-style no-theme"
              :class="{'ace-plaintext': item.hashMarkers && item.hashMarkers.length }"
              :data-markers="Marker.joining(item.hashMarkers)" translate="no" style="margin-top:1px;margin-bottom:-1px">{{ item.hash }}</code>
        <small v-if="item.version" style="font-weight: normal;font-size: 12px;margin: 3px 0 0 10px;opacity: 0.75;">
          since {{ item.version.displayLabel }}
          <button v-if="item.changeRefs.length > 1" class="change-refs-trigger secondary small fontWeight600 expand-action collapsed-state"
                  :ui-action="`expando: #change-refs-${item.resultNumber}`"
                  :data-hash="item.hash" style="border-radius:5px;font-size:12px"
                  :data-result-target="`change-refs-${item.resultNumber}`"
                  ui-tippy-hover="Expand change refs">
            <span class="spacer3-right">+{{ item.changeRefs.length - 1 }}</span>
            <span class="change-refs-trigger-icon collapsed-only valign" style="font-size:12px;margin-left:-2px;"><Icon name="chevrons-down" /></span>
            <span class="change-refs-trigger-icon expanded-only valign" style="font-size:12px;margin-left:-2px;"><Icon name="chevrons-up" /></span>
          </button>
        </small>
        <span class="grow"></span>
        <small class="fontWeight400 spacer10-right" style="opacity:0.5">Result #{{ item.resultNumber }}</small>
        <button class="secondary small fontWeight500 spacer5-right"
                :ui-action="`copy: #wikitext-${item.resultNumber}`"
                ui-tippy-hover="Click to copy to clipboard"
                ui-tippy-flash="{content:'Copied!', delay: [0,2000]}"
                style="margin:5px 0">Copy</button>
        <a role="button" class="secondary small fontWeight500 spacer5-right"
                         :href="`${ctx.siteHome}/OL?q=${item.hash}`" target="_blank">
          <span class="spacer5-right">OL Result</span><Icon name="external-link" />
        </a>
        <button class="excel-usages-trigger secondary small fontWeight500 expand-action collapsed-state"
                :data-hash="item.hash"
                :data-result-target="`excel-usages-${item.resultNumber}`" ui-tippy-hover="Load usages">
          <span class="spacer3-right">Usages</span>
          <span class="excel-usages-trigger-icon collapsed-only valign"><Icon name="chevrons-down" /></span>
          <span class="excel-usages-trigger-icon expanded-only valign"><Icon name="chevrons-up" /></span>
          <span class="excel-usages-loading-icon valign justifyCenter hide" style="width:13.75px">
            <span class="loading small"></span>
          </span>
        </button>
      </h2>
      <div class="dialogue-section content" style="margin:0;padding: 7px 7px 2px;">
        <Wikitext :id="`wikitext-${item.resultNumber}`" :markers="item.markers" :value="item.text" />
      </div>
      <div v-if="item.changeRefs.length > 1" :id="`change-refs-${item.resultNumber}`" class="change-refs-result collapsed hide content" style="padding-top:15px">
        <div class="card" style="margin-bottom:0">
          <div v-for="changeRef of item.changeRefs" class="change-ref">
            <h3 class="secondary-header valign">
              <span>Version {{ changeRef.version.displayLabel }}:</span>&nbsp;
              <span>{{ changeRef.changeType }}</span>
            </h3>
            <div class="content change-ref-content" :data-json="JSON.stringify(changeRef)">
              <Wikitext :value="changeRef.value" />
              <div class="diff-ui-area"></div>
            </div>
          </div>
        </div>
      </div>
      <div :id="`excel-usages-${item.resultNumber}`" class="excel-usages-result collapsed hide"></div>
      <div style="height:6px"></div>
    </section>
    <section v-if="hasMoreResults" class="card search-load-more-container">
      <div class="content">
        <button id="search-load-more" class="dispBlock primary primary--2 w100p" style="padding:5px">Click to load next page</button>
      </div>
    </section>
    <section v-if="!items.length" class="card">
      <div class="content">
        <strong>No matches found.</strong>
        <p v-if="langSuggest && !langSuggest.matchesInputLangCode" class="error-notice spacer10-top">
          Your input language is <strong style="font-size:1.2em">{{ ctx.languages[ctx.inputLangCode] }}</strong>
          but the query you entered was detected to be <strong style="font-size:1.2em">{{ langSuggest.detected.langName }}</strong>
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { TextMapSearchResponse } from '../../../../shared/types/lang-types.ts';
import { getTrace } from '../../../middleware/request/tracer.ts';
import { Marker } from '../../../../shared/util/highlightMarker.ts';
import Icon from '../../utility/Icon.vue';
import Wikitext from '../../utility/Wikitext.vue';

const { ctx } = getTrace();

const props = defineProps<{
  response?: TextMapSearchResponse
}>();

const {
  items,
  hasMoreResults,
  continueFromLine,
  resultSetIdx,
  langSuggest,
} = props.response;
</script>
