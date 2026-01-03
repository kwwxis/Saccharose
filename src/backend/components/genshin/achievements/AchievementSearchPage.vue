<template>
  <section class="card">
    <h2>Achievements</h2>
    <div class="tab-list" role="tablist">
      <a href="/genshin/achievements" role="tab" id="tab-categories" class="tab"
         :class="{active: ctx.hasBodyClass('page--achievements-categories')}">Categories</a>
      <a href="/genshin/achievements/search" role="tab" id="tab-search" class="tab"
         :class="{active: ctx.hasBodyClass('page--achievements-search')}">Search</a>
    </div>
    <div class="content form-box">
      <p>Search for achievements by name, description, or ID.</p>
      <div class="field valign">
        <div class="posRel valign grow">
          <input class="search-input grow" type="text" placeholder="Enter text to search for." style="border-radius:3px 0 0 3px" />
          <button class="search-input-paste input-paste-button"><Icon name="clipboard" /></button>
          <button class="search-input-clear input-clear-button hide"><Icon name="x-circle" /></button>
        </div>
        <SearchModeInput />
      </div>
      <div class="field valign spacer10-top">
        <button class="search-submit primary primary--2">Search</button>
        <div class="search-submit-pending hide loading small spacer5-left"></div>
      </div>
    </div>
  </section>
  <div id="search-result"></div>
</template>

<script setup lang="ts">
import SearchModeInput from '../../utility/SearchModeInput.vue';
import Icon from '../../utility/Icon.vue';
import { useTrace } from '../../../middleware/request/tracer.ts';

const { ctx } = useTrace();
</script>
