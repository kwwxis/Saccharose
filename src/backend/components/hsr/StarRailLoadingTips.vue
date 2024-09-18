<template>
  <section class="card">
    <h2>Loading Tips</h2>
    <div class="content">
      <Wikitext :value="wikitext" />
    </div>
  </section>
</template>

<script setup lang="ts">
import Wikitext from '../utility/Wikitext.vue';

defineProps<{
  wikitext: string
}>();
</script>
