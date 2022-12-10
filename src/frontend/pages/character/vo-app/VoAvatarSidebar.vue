<template>
  <div class="card">
    <p class="greeting">{{ greeting }}</p>
  </div>
</template>

<style>
.greeting {
  color: red;
}
</style>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'VoAvatarSidebar',
  data() {
    return {
      greeting: 'Hello World!',
    }
  }
});
</script>