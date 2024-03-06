<template>
  <div class="card">
    <h2>Upcoming change on how numbers are formatted</h2>
    <div class="content">
      <h3>Current situation</h3>
      <p>The site sometimes presents numbers as formatted, and this format was always in English, using commas for
      thousands separators and periods as the separator between the integer and fractional part as applicable.</p>

      <div class="image-frame spacer10-vert">
        <img src="/images/site/notices/number-formatting-1.png" style="max-width:600px" />
      </div>

      <h3 class="spacer10-top">Proposed changes</h3>
      <p>Going forward, numbers will be formatted according to the locale of the user's currently selected
        <strong>Output Language</strong>.</p>
      <p>Unless any adjustments are requested, the new number formatting will follow this table:</p>

      <table class="article-table spacer10-vert">
        <tr>
          <th style="text-align: left">Output Language</th>
          <th style="text-align: left">Locale</th>
          <th>Formatted Number Example<br /><small>Without decimal places</small></th>
          <th>Formatted Number Example<br /><small>With decimal places</small></th>
        </tr>
        <tr v-for="[langCode, locale] of getLocales()">
          <td>{{ langCode }}</td>
          <td>{{ locale }}</td>
          <td style="text-align: center"><code style="font-size:16px">{{ (70123).toLocaleString(locale).replace(/\s/g, ' ') }}</code></td>
          <td style="text-align: center"><code style="font-size:16px">{{ (70123.456).toLocaleString(locale).replace(/\s/g, ' ') }}</code></td>
        </tr>
      </table>

      <h3 class="spacer10-top">Adjustments</h3>
      <p>If there need to be any adjustments to how a number should be formatted for a particular language,
        <a href="/contact">please contact me</a>.</p>

      <p>So far the following adjustments have been requested:</p>
      <ul class="spacer10-top">
        <li><strong>RU:</strong> No thousands separator at all, e.g. <code>70123</code>.</li>
      </ul>
    </div>

  </div>
</template>

<script setup lang="ts">
import { LANG_CODE_TO_LOCALE } from '../../../../shared/types/lang-types.ts';

function getLocales(): [string, string][] {
  return Object.entries(LANG_CODE_TO_LOCALE);
}
</script>
