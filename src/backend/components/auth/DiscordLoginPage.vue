<template>
  <div class="wrapper">
    <section class="card">
      <h2>Welcome to Saccharose.wiki</h2>
      <div class="content">
        <p>Please login with Discord. Saccharose will only have access to your Discord ID, username, avatar, and banner image.</p>
        <a :href="`/auth/discord?cont=` + myCont" role="button" class="spacer10-top primary primary--2">Login</a>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { getTrace } from '../../middleware/request/tracer.ts';

const { cont } = defineProps<{
  cont?: string,
}>();

let myCont = cont;

if (!myCont) {
  myCont = getTrace().req.url;
}
</script>
