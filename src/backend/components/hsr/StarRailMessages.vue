<template>
  <h2>Messages</h2>
  <div class="content dispFlex flexWrap alignStart">
    <div v-for="avatar of avatars" class="w50p">
      <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/messages/${avatar.Id}`">
        <img class="icon x32" :src="`/images/hsr/${avatar.DefaultHeadIconPath}`" loading="lazy" decoding="async" />
        <span class="spacer10-left">{{ normStarRailText(avatar.NameText) }}</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AvatarConfig } from '../../../shared/types/hsr/hsr-avatar-types.ts';
import { getTrace } from '../../middleware/request/tracer.ts';
const { normStarRailText } = getTrace();

defineProps<{
  avatars?: AvatarConfig[]
}>();
</script>
