<template>
  <section class="card">
    <h2>TCG Stages</h2>
    <div class="tab-list secondary" role="tablist">
      <a href="/genshin/TCG/stages" role="tab" id="tab-list" class="tab">List</a>
      <a href="/genshin/TCG/stages/search" role="tab" id="tab-search" class="tab active">Search</a>
    </div>
    <div class="content form-box">
      <p class="spacer10-bottom">Search TCG stages by ID, stage name, or stage opponent name.</p>
      <div class="field valign">
        <div class="posRel valign grow">
          <input class="stage-search-input grow" type="text" placeholder="Search stages" />
          <button class="stage-search-input-paste input-paste-button"><Icon name="clipboard" /></button>
          <button class="stage-search-input-clear input-clear-button hide"><Icon name="x-circle" /></button>
        </div>
        <SearchModeInput />
      </div>
      <div class="field valign spacer10-top">
        <button class="stage-search-submit primary primary--2">Search</button>
        <div class="stage-search-submit-pending hide loading small spacer5-left"></div>
      </div>
    </div>
  </section>
  <div id="tcg-stage-search-result"></div>
</template>

<script setup lang="ts">
import SearchModeInput from '../../utility/SearchModeInput.vue';
import Icon from '../../utility/Icon.vue';
</script>
