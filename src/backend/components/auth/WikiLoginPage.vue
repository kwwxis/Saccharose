<template>
  <div class="wrapper">
    <section class="card">
      <h2>Next steps: register your wiki username</h2>
      <div class="content">
        <p class="spacer10-bottom">Please register your wiki info <span class="highlight">(you only need to do this once)</span>, but you'll be
          abel to de-register and re-register with a different wiki user from your settings page if you want.</p>
        <ol>
          <li>
            <strong>You are registering your Fandom wiki username to this Discord user:</strong>
            <div class="valign">
              <img :src="avatarUrl" class="framed-icon x48" />
              <div class="dispFlex flexColumn spacer5-left">
                <span class="open-sans-font fontWeight600">@{{ user.discord_username }}</span>
                <span>To start over with a different Discord user: <a :href="`/auth/logout?cont=` + myCont">logout</a></span>
              </div>
            </div>
          </li>
          <li>
            <strong>You must specify the username of your Fandom Wiki user that is <span class="highlight">autoconfirmed</span>
              and has <span class="highlight">at least 100 edits</span> in at least one of the following wikis:</strong>
            <ul>
              <li>genshin-impact.fandom.com</li>
              <li>honkai-star-rail.fandom.com</li>
              <li>zenless-zone-zero.fandom.com</li>
            </ul>
            If you don't meet these requirements and would like access, let Kwwxis know.
          </li>
          <li>
            <strong>Update your Fandom Wiki user's Discord handle to match that of the currently logged in user.</strong>
            <ol>
              <li>Go to your user page on any Fandom wiki (Fandom profile is the same across every wiki)</li>
              <li>
                <div>Click "Edit Profile"</div>
                <div class="image-frame bordered" style="max-width:500px">
                  <span class="image-label">Example image:</span>
                  <img src="/images/site/auth/FandomProfile-1.png" class="w100p" />
                </div>
              </li>
              <li>
                <div>Enter in your Discord username and click save</div>
                <div>(you can remove it from your Fandom profile after registering if you want)</div>
                <div class="image-frame bordered" style="max-width:400px">
                  <span class="image-label">Example image:</span>
                  <img src="/images/site/auth/FandomProfile-2.png" class="w100p" />
                </div>
              </li>
            </ol>
          </li>
          <li>
            <strong>Enter your info:</strong>
            <fieldset class="form-box">
              <p class="spacer5-bottom">Leave the <strong>Language Code</strong> field blank for English wiki. If you're for one of the other language
                wikis like <code>https://genshinimpact.fandom.com/<strong>it</strong>/wiki/</code> then put <code class="highlight">it</code> in the field value, not the URL.</p>
              <p class="spacer15-bottom">The Language Code field is only used for the purpose of checking the number of edits.
                It doesn't matter which OL wiki you use if you meet the condition on multiple OL wikis.</p>

              <div class="field valign">
                <label style="min-width: 200px">Fandom Wiki username</label>
                <input id="wiki-username" type="text" style="min-width:350px" />
              </div>
              <div class="field valign">
                <label style="min-width: 200px">Fandom Wiki Language Code</label>
                <input id="wiki-lang" type="text" style="min-width:350px" />
              </div>
              <div class="field valign spacer10-top">
                <label style="min-width: 200px"></label>
                <button id="wiki-check" role="button" class="primary primary--2">Check</button>
                <span id="wiki-check-pending" class="loading spacer5-left hide"></span>
                <span id="wiki-check-error" class="hide" style="color:red"></span>
                <span id="wiki-check-complete" class="hide" style="color:green"></span>
              </div>
            </fieldset>
          </li>
        </ol>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { getTrace } from '../../middleware/request/tracer.ts';
import { SiteUser, SiteUserProvider } from '../../middleware/auth/SiteUserProvider.ts';

const { cont } = defineProps<{
  cont?: string,
}>();

let myCont = cont;

if (!myCont) {
  myCont = getTrace().req.url;
}

let user: SiteUser = getTrace().req.user;
let avatarUrl: string = SiteUserProvider.getAvatarUrl(user);
</script>
