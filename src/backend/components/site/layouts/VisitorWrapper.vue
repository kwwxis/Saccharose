<template>
  <div id="app-wrapper" class="wrapper">
    <div class="alignStart">
      <main id="app-main">
        <div class="card">
          <div class="content valign justifySpaceBetween" style="padding:5px 0;">
            <div class="valign">
              <div class="valign">
                <AppModeSelector dropdown-id="site-mode-dropdown" switch-rel-path="/OL" />
              </div>
              <div class="valign spacer10-left">
                <AppThemeButtons />
              </div>
            </div>
            <div class="valign">
              <AppLanguageSelector :hide-output-language-selector="true" />
            </div>
          </div>
        </div>
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppModeSelector from '../sitemenu/AppModeSelector.vue';
import AppThemeButtons from '../sitemenu/AppThemeButtons.vue';
import AppLanguageSelector from '../sitemenu/AppLanguageSelector.vue';

defineProps<{

}>();
</script>

