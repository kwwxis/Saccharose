<template>
  <div class="wrapper">
    <article class="card legal-doc" role="main">
      <div class="content">
        <header id="contact-methods">
          <h1>{{ SITE_TITLE }} - Contact</h1>
        </header>
        <aside id="toc" class="no-fixed split" aria-label="Table of Contents">
          <section data-title="Contact">
            <a role="listitem" href="#contact-methods">Contact Methods</a>
          </section>
          <section data-title="Legal Documents and Notices">
            <a role="listitem" href="/terms">Terms and Conditions</a>
            <a role="listitem" href="/privacy">Privacy Policy</a>
            <a role="listitem" href="/contact">Contact</a>
          </section>
        </aside>
        <p>There are several methods for contact:</p>
        <ul>
          <li>
            <strong>Discord thread:</strong>
            <p>The <code>{{ SITE_TITLE }}</code> thread of <code>editing-forums</code> in the Genshin Impact Fandom Wiki discord server.</p>
            <p>(Some users may not have access to this method)</p>
          </li>
          <li>
            <strong>Discord message:</strong>
            <p>DM username <code>kwwxis</code> on Discord.</p>
            <p>If you do message, and you're not someone I already know, please follow <a href="https://nohello.net/">nohello.net</a> etiquette.
              If you only say "hello," I might ignore you thinking you're an art commission scammer or something.</p>
          </li>
          <li>
            <strong>Reddit message:</strong>
            <p>PM username <code>u/kwwxis</code> on Reddit.</p>
          </li>
          <li>
            <strong id="label1"></strong>
            <p>
              <span id="value1" style="cursor:pointer">(click to show)</span>
            </p>
          </li>
        </ul>
      </div>
    </article>
  </div>
  <HtmlScript :content="frontendJs" :nonce="nonce" />
</template>

<script setup lang="ts">
import { getTrace } from '../../middleware/request/tracer.ts';
import { SITE_SHORT_TITLE, SITE_TITLE } from '../../loadenv.ts';

const { nonce } = getTrace();

// language=JavaScript
import HtmlScript from '../utility/HtmlScript.vue';

let frontendJs = `
  document.querySelector('#label1').innerText = atob('RW1haWw6');
  document.querySelector('#value1').addEventListener('click', event => {
    if (!event.isTrusted) {
      return;
    }
    if (event.target.classList.contains('selected')) {
      return;
    }
    event.target.classList.add('selected');

    const proto = atob('bWFpbHRv');
    const value = atob('a3d3eGlzQGdtYWlsLmNvbQ==');
    event.target.innerHTML = '<a href="' + proto + ':' + value + '">' + value + '</a>';
  });
`;
</script>
