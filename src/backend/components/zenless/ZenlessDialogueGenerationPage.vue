<template>
  <section class="card">
    <h2>Dialogue Generation</h2>
    <div class="content">
      <p class="info-notice">
        <strong>Beta:</strong> <span>This tool is very new and may not work properly. Be sure to verify generated outputs
        with what's actually in-game.</span>
      </p>
      <p class="info-notice">
        <strong>Limited:</strong> <span>Only certain types of dialogue are supported.</span>
      </p>
    </div>
    <div class="content form-box">
      <div class="field valign">
        <div class="posRel valign grow">
          <input class="search-input grow" type="text" placeholder="Enter text to search for in TextMap." style="border-radius:3px 0 0 3px" />
          <button class="search-input-paste input-paste-button"><Icon name="clipboard" /></button>
          <button class="search-input-clear input-clear-button hide"><Icon name="x-circle" /></button>
        </div>
        <SearchModeInput />
      </div>
      <div class="field valign spacer10-top">
        <button class="search-submit primary primary--2">Generate</button>
        <div class="search-submit-pending hide loading small spacer5-left"></div>
      </div>
    </div>
  </section>
  <div id="search-result"></div>
</template>

<script setup lang="ts">
import Icon from '../utility/Icon.vue';
import SearchModeInput from '../utility/SearchModeInput.vue';
</script>
