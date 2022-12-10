<template>
  <VoAvatarSidebar></VoAvatarSidebar>
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
import VoAvatarSidebar from './VoAvatarSidebar.vue';

export default defineComponent({
  name: 'VoApp',
  components: { VoAvatarSidebar },
  data() {
    return {
      greeting: 'Hello World!' as string,
    }
  }
});
</script>