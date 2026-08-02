<template>
  <div class="site-mode-selector valign spacer10-left posRel">
    <button class="site-mode-dropdown-button secondary"
            :class="{'border-light': !noBorderLight}"
            :ui-action="`dropdown: #${dropdownId}`">
      <img :src="imageSrc" :style="imageStyle" />
      <span class="spacer10-left spacer5-right">{{ ctx.siteModeName }}</span>
      <Icon name="chevron-down" />
    </button>
    <div :id="dropdownId"
         class="site-mode-dropdown ui-dropdown"
         :class="dropdownExtraClass">
      <a :href="`/genshin${ switchRelPath || ''}`" class="option valign" ui-action="dropdown-item">
        <img src="/images/site/logo/Sucrose.webp" style="width:16px;height:auto" />
        <span class="spacer5-left">Genshin Impact</span>
      </a>
      <a :href="`/hsr${ switchRelPath || ''}`" class="option valign" ui-action="dropdown-item">
        <img src="/images/site/logo/March_7th_Sticker_1.webp" style="width:16px;height:auto" />
        <span class="spacer5-left">Honkai Star Rail</span>
      </a>
      <a :href="`/zenless${ switchRelPath || ''}`" class="option valign" ui-action="dropdown-item">
        <img src="/images/site/logo/Belle.webp" style="width:16px;height:auto;border-radius:50%" />
        <span class="spacer5-left">Zenless Zone Zero</span>
      </a>
      <a :href="`/wuwa${ switchRelPath || ''}`" class="option valign" ui-action="dropdown-item">
        <img src="/images/site/logo/Yangyang.webp" style="width:16px;height:auto;border-radius:50%" />
        <span class="spacer5-left">Wuthering Waves</span>
      </a>
      <div class="option-sep"></div>
      <a href="/" class="option valign" ui-action="dropdown-item">
        <img src="/images/site/logo/Saccharose.webp" style="width:16px;height:auto" />
        <span class="spacer5-left">Site Home</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '../../utility/Icon.vue';
import { useTrace } from '../../../middleware/request/tracer.ts';

const { ctx } = useTrace();

let imageSrc: string;
let imageStyle: string;
switch (ctx.siteMode) {
  case "unset":
    imageSrc = "/images/site/logo/Saccharose.webp";
    imageStyle = "width:24px;height:auto;margin:-1px 0 -1px -5px";
    break;
  case "genshin":
    imageSrc = "/images/site/logo/Sucrose.webp";
    imageStyle = "width:24px;height:auto;margin:-1px 0 -1px -5px";
    break;
  case "hsr":
    imageSrc = "/images/site/logo/March_7th_Sticker_1.webp";
    imageStyle = "width:24px;height:auto;margin:-1px 0 -1px -5px";
    break;
  case "zenless":
    imageSrc = "/images/site/logo/Belle.webp";
    imageStyle = "width:24px;height:auto;border-radius:50%;margin:-1px 0 -1px -5px";
    break;
  case "wuwa":
    imageSrc = "/images/site/logo/Yangyang.webp";
    imageStyle = "width:24px;height:auto;border-radius:50%;margin:-1px 0 -1px -5px";
    break;
}

defineProps<{
  dropdownId: string,
  switchRelPath?: string,
  noBorderLight?: boolean,
  dropdownExtraClass?: string|string[]|Record<string, boolean>
}>();
</script>

