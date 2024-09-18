<template>
  <section class="card">
    <h2>TextMap Search</h2>
    <div class="content form-box">
      <p class="spacer10-bottom">Enter any arbitrary text and search for it in the TextMap, returning the full TextMap
        item that the text was found in (up to 100 search results).</p>
      <div class="field valign">
        <div class="posRel valign grow">
          <input class="search-input grow" type="text" placeholder="Enter text to search for in TextMap." style="border-radius:3px 0 0 3px" />
          <button class="search-input-paste input-paste-button"><Icon name="clipboard" /></button>
          <button class="search-input-clear input-clear-button hide"><Icon name="x-circle" /></button>
        </div>
        <SearchModeInput />
      </div>
      <div class="field valign">
        <label class="ui-checkbox dispBlock" style="padding-left:5px;font-size:13px;">
          <input id="isRawInput" type="checkbox" name="isRawInput" value="1" />
          <span>Use raw input</span>
        </label>
        <label class="ui-checkbox dispBlock" style="padding-left:5px;font-size:13px;">
          <input id="isRawOutput" type="checkbox" name="isRawOutput" value="1" />
          <span>Use raw output</span>
        </label>
        <label class="ui-checkbox dispBlock" style="padding-left:5px;font-size:13px;">
          <input id="hashSearch" type="checkbox" name="hashSearch" value="1" />
          <span>Hash search</span>
        </label>
        <label v-if="enableVersionFilter" class="ui-checkbox dispBlock" style="padding-left:5px;font-size:13px;">
          <input id="versionFilterEnabled" type="checkbox" name="versionFilterEnabled" value="1" />
          <span>Version filter</span>
        </label>
      </div>
      <div id="versionFilterOuter" class="field hide">
        <input id="versionFilter" type="text" placeholder="Versions separated by comma or semicolon (only supported from 4.0 onwards)"
               style="max-width: 490px;width: 100%;"/>
      </div>
      <div class="field valign spacer10-top">
        <button class="search-submit primary primary--2">Search</button>
        <div class="search-submit-pending hide loading small spacer5-left"></div>
      </div>
    </div>
    <input id="startFromLine" type="text" style="display:none!important;" />
    <input id="resultSetNum" type="text" style="display:none!important;" />
  </section>
  <div id="search-result"></div>
</template>

<script setup lang="ts">
import SearchModeInput from '../utility/SearchModeInput.vue';
import Icon from '../utility/Icon.vue';

defineProps<{
  enableVersionFilter?: boolean,
}>()
</script>
