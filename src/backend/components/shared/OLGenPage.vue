<template>
  <section class="card">
    <h2 class="valign">
      <span>OL Generate</span>
      <span class="grow"></span>
      <button id="ol-info-button" class="secondary">Info</button>
    </h2>
    <div class="content">
      <p class="spacer5-bottom">Generate <WikiTemplateLink name="Other Languages" /> template with official names filled out.</p>
      <div class="field valign">
        <div class="valign grow" style="max-width:500px">
          <div class="posRel valign grow">
            <input class="ol-input w100p" type="text" placeholder="Enter a name (case insensitive) or TextMapHash" />
            <button class="ol-input-paste input-paste-button"><Icon name="clipboard" /></button>
            <button class="ol-input-clear input-clear-button hide"><Icon name="x-circle" /></button>
          </div>
          <button class="ol-submit primary primary--2 spacer5-left">Generate</button>
        </div>
        <div class="ol-submit-pending hide loading small spacer5-left"></div>
      </div>
      <div v-if="!hideAllOptions" class="alignStart spacer15-top flexWrap">
        <fieldset v-if="!hideTlOption" class="spacer5-right">
          <legend><code>_tl</code> options</legend>
          <div class="field spacer5-horiz" style="padding-right:30px">
            <label class="ui-radio dispBlock" style="padding-left:5px;font-size:13px;">
              <input type="radio" name="tl_options" value="none"
                     :checked="ctx.cookieTernary('OL.tl_options').equals('none').or.isEmpty().get()" />
              <span>Include <code>[lang]_tl</code> params*</span>
            </label>
            <label class="ui-radio dispBlock" style="padding-left:5px;font-size:13px;">
              <input type="radio" name="tl_options" value="exclude_tl"
                     :checked="ctx.cookieTernary('OL.tl_options').equals('exclude_tl').get()" />
              <span>Exclude <code>[lang]_tl</code> params</span>
            </label>
          </div>
        </fieldset>
        <fieldset v-if="!hideRmOption" class="spacer5-right">
          <legend><code>_rm</code> options</legend>
          <div class="field spacer5-horiz" style="padding-right:30px">
            <label class="ui-radio dispBlock" style="padding-left:5px;font-size:13px;">
              <input type="radio" name="rm_options" value="none"
                     :checked="ctx.cookieTernary('OL.rm_options').equals('none').or.isEmpty().get()" />
              <span>Include <code>[lang]_rm</code> params</span>
            </label>
            <label class="ui-radio dispBlock" style="padding-left:5px;font-size:13px;">
              <input type="radio" name="rm_options" value="exclude_rm"
                     :checked="ctx.cookieTernary('OL.rm_options').equals('exclude_rm').get()" />
              <span>Exclude <code>[lang]_rm</code> params</span>
            </label>
          </div>
        </fieldset>
        <fieldset v-if="!hideOtherOptions" class="spacer5-right">
          <legend>Other options</legend>
          <div class="field spacer5-horiz" style="padding-right:30px">
            <label class="ui-checkbox dispBlock" style="padding-left:5px;font-size:13px;">
              <input type="checkbox" name="ol_header" value="1"
                     :checked="ctx.cookieTernary('OL.includeHeader').isTruthy().get()" />
              <span>Include header</span>
            </label>
          </div>
        </fieldset>
      </div>
    </div>
  </section>
  <div id="ol-results-list"></div>
</template>

<script setup lang="ts">
import Icon from '../utility/Icon.vue';
import { getTrace } from '../../middleware/request/tracer.ts';
import WikiTemplateLink from '../utility/WikiTemplateLink.vue';

const { ctx } = getTrace();

defineProps<{
  hideAllOptions?: boolean,
  hideTlOption?: boolean,
  hideRmOption?: boolean,
  hideOtherOptions?: boolean,
}>()
</script>
