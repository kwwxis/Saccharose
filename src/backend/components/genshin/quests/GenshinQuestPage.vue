<template>
  <section class="card">
    <h2>Find Quest</h2>
    <div class="content">
      <p class="spacer10-bottom">Search for a quest by its full name or keywords. You can also enter a specific quest ID.</p>
      <div class="field valign">
        <div class="valign grow" style="max-width:700px">
          <div class="posRel valign grow">
            <input class="quest-search-input grow" type="text" placeholder="Enter quest name" style="border-radius:3px 0 0 3px" />
            <button class="quest-search-input-paste input-paste-button" ui-tippy="Paste"><Icon name="clipboard" /></button>
            <button class="quest-search-input-clear input-clear-button with-paste-button hide" ui-tippy="Clear"><Icon name="x-circle" /></button>
          </div>
          <SearchModeInput />
          <button class="quest-search-submit primary primary--2 spacer5-left">Search</button>
        </div>
        <div class="quest-search-submit-pending hide loading small spacer5-left"></div>
      </div>
    </div>
    <div id="quest-search-result" class="content hide"></div>
  </section>
  <div id="quest-generate-result"></div>
</template>

<script setup lang="ts">
import Icon from '../../utility/Icon.vue';
import SearchModeInput from '../../utility/SearchModeInput.vue';

defineProps<{

}>();
</script>

<style scoped lang="scss">

</style>
