<template>
  <section class="card">
    <h2>Media Search</h2>
    <div class="tab-list" role="tablist">
      <a href="/genshin/media/list" role="tab" class="tab">List</a>
      <a href="/genshin/media/search" role="tab" class="tab active">Search</a>
    </div>
    <h3>Search Images by Name</h3>
    <div class="content form-box">
      <p class="spacer5-bottom" style="font-size:14px">For this specific tool, the <code>W</code> and <code>WI</code> search modes are treated the same as <code>C</code> and <code>CI</code> respectively due to word-search not working well on the image names.</p>
      <div id="image-name-search-inputs" class="field valign">
        <div class="posRel valign grow">
          <input class="image-name-search-input grow" type="text" placeholder="Enter file name query" />
          <button class="image-name-search-input-clear input-clear-button hide"><Icon name="x-circle" /></button>
        </div>
        <SearchModeInput />
      </div>
      <div class="valign">
        <input id="firstVersionFilter" type="text" placeholder="Optional versions separated by comma or semicolon"
               style="max-width: 490px;width: 100%;"/>
        <span ui-tippy="{content: 'Only filters images to the version it was first added. Does not account for modifications. Only available for 2.0 onwards.',delay:[200, 100]}"
              class="valign spacer10-left" style="opacity: 0.5; width: 19px;">
          <Icon name="info" />
        </span>
      </div>
      <div class="field valign spacer10-top">
        <button class="image-name-search-submit primary primary--2">Search</button>
        <div class="image-name-search-submit-pending hide loading small spacer5-left"></div>
      </div>
    </div>
  </section>
  <input id="mediaSearchOffset" type="text" style="display:none!important;" />
  <section class="card hide" id="image-name-search-result-wrapper">
    <h2 class="valign">
      <span>Results</span>
      <span class="grow"></span>
      <span id="image-name-search-result-download-button-area"></span>
    </h2>
    <div id="image-name-search-result" class="content justifyStart alignStart flexWrap"></div>
  </section>
</template>

<script setup lang="ts">
import SearchModeInput from '../../utility/SearchModeInput.vue';
import Icon from '../../utility/Icon.vue';
</script>
