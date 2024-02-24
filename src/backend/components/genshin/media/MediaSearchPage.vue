<template>
  <section class="card">
    <h2>Media Search</h2>
    <div class="tab-list" role="tablist">
      <a href="/media/list" role="tab" class="tab">List</a>
      <a href="/media/search" role="tab" class="tab active">Search</a>
      <a href="/media/reverse-search" role="tab" class="tab">Reverse Search</a>
    </div>
    <h3>Search Images by Name</h3>
    <div class="content form-box">
      <div id="image-name-search-inputs" class="field valign">
        <div class="posRel valign grow">
          <input class="image-name-search-input grow" type="text" placeholder="Enter dialogue line or part of a dialogue line." />
          <button class="image-name-search-input-clear input-clear-button hide"><Icon name="x-circle" /></button>
        </div>
        <SearchModeInput />
      </div>
      <div class="field valign spacer10-top">
        <button class="image-name-search-submit primary primary--2">Search</button>
        <div class="image-name-search-submit-pending hide loading small spacer5-left"></div>
      </div>
    </div>
  </section>
  <input id="mediaSearchOffset" type="text" style="display:none!important;" />
  <section class="card hide" id="image-name-search-result">
    <h2>Results</h2>
    <div class="content justifyStart alignStart flexWrap"></div>
  </section>
</template>

<script setup lang="ts">
import SearchModeInput from '../../utility/SearchModeInput.vue';
import Icon from '../../utility/Icon.vue';
</script>
