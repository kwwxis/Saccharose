<template>
  <div class="wrapper">
    <article class="card legal-doc" role="main">
      <div class="content">
        <header>
          <h1>{{ SITE_TITLE }} - Privacy Policy</h1>
          <p>Effective: January 28th, 2024.</p>
        </header>
        <aside id="toc" class="no-fixed split" aria-label="Table of Contents">
          <section data-title="Privacy Policy">
            <a role="listitem" href="#what_and_why">What Information Is Collected</a>
            <a role="listitem" href="#how">How Is The Information Used</a>
            <a role="listitem" href="#with_whom">With Whom Is The Information Shared</a>
            <section>
              <a role="listitem" href="#with_whom_p1">Essential Third-Party Services</a>
              <a role="listitem" href="#with_whom_p2">Our Staff</a>
              <a role="listitem" href="#with_whom_p3">Law &amp; Order</a>
              <a role="listitem" href="#with_whom_p4">And Nobody Else</a>
            </section>
            <a role="listitem" href="#information_security">Information Security</a>
            <a role="listitem" href="#your_choices">Your Choices</a>
            <a role="listitem" href="#changes">Changes</a>
            <a role="listitem" href="#contact">Contact</a>
          </section>
          <section data-title="Legal Documents and Notices">
            <a role="listitem" href="/terms">Terms and Conditions</a>
            <a role="listitem" href="/privacy">Privacy Policy</a>
            <a role="listitem" href="/contact">Contact</a>
          </section>
        </aside>
        <section style="padding-bottom: 0;">
          <p>{{ SITE_TITLE }} ("{{ SITE_SHORT_TITLE }}", "us", "we", or "our") operates
            <a :href="`https://${env.WEB_DOMAIN}`">{{ env.WEB_DOMAIN }}</a> (the "Website", or the "Service").</p>

          <p>This Privacy Policy informs you of the site's policies regarding how it collects, uses,
            and handles your information</p>
        </section>
        <section class="function">
          <h2 id="what_and_why">What Information Is Collected</h2>

          <ul>
            <li><strong>Basic information about your Discord user account:</strong>
              <p>By logging into our Website using your Discord account, you agree to give us access to
                information afforded to us by Discord limited to only the "identify" OAuth scope.</p>
              <p>This OAuth scope gives us access to only:</p>
              <ul>
                <li>Your Discord user ID;</li>
                <li>Discord username;</li>
                <li>Discord avatar image;</li>
                <li>Discord banner image;</li>
                <li>and other basic Discord user info (all fields on the <a href="https://discord.com/developers/docs/resources/user#user-object">Discord User Object</a> excluding email).</li>
              </ul>
            </li>
            <li>
              <strong>Public information about your Fandom user account:</strong>
              <p>By associating a Fandom user account to your Discord account in our Website, you agree to that association.
                This means that the Discord account you logged in as is either the same person as the owner of the associated
                Fandom user account or is authorized to be associated by the owner of that Fandom user account. After performing
                this association, the Website may use any public information about that Fandom user account,
                which includes your Fandom user ID, username, avatar image, profile bio text, etc. The Website does not
                have access to any non-public information related to your Fandom account.</p>
            </li>
            <li>
              <strong>Access Logging:</strong>
              <p>{{ SITE_TITLE }} may collect limited non-personally identifying information your browser makes
                available whenever you visit any website on the internet. This information may include but not limited to your
                Internet Protocol address, browser type, browser language, OS version, the date and time of your
                visit and one or more cookies that may uniquely identify your browser. We use this information to
                operate, develop and improve our Services. This information may be kept indefinitely.</p>
            </li>
            <li>
              <strong>Website Cookies:</strong>
              <p>A "cookie" is a small file containing a string of characters that is sent to your computer when
                you visit a website. You can set your browser settings to refuse all cookies or to indicate when a cookie is being sent. However, the Website
                may not function properly without cookies or may not function at all. There also may be third-party cookies
                set by Cloudflare, our Content Delivery Network provider.</p>
            </li>
          </ul>
        </section>
        <section class="function">
          <h2 id="how">How Is The Information Used</h2>

          <p>The information collected by our Service is used to provide, improve, and protect our Service.</p>
          <ul>
            <li>Discord and Fandom user account info is used to restrict access to the Website to prevent unwanted users
              as this Website is only intended to be used by editors of certain wikis.</li>
            <li>Access Logging is used for traffic analytics purposes and to monitor and block bad actors from accessing the site.</li>
            <li>Cookies are used for session management purposes and to provide customization options for users.</li>
          </ul>
        </section>
        <section class="function">
          <h2 id="with_whom">With Whom Is The Information Shared</h2>

          <h4 id="with_whom_p1">Essential Third-Party Services</h4>
          <p>We may use third-party services to store, process, transmit data, or perform other technical
            functions related to operating our Services. These third-party services currently only include
            our server host (DigitalOcean), our Content Delivery Network (Cloudflare CDN), and our DNS Registrar
            (Cloudflare Registrar). What these third-party services do with the information is out of our control;
            you would need to review their Privacy Policies for more info.</p>

          <h4 id="with_whom_p2">Our Staff</h4>
          <p>Your information may be accessible to any of {{ SITE_TITLE }}'s staff who need to
            access that information in order to operate, develop or improve our Services.</p>

          <h4 id="with_whom_p3">Law &amp; Order</h4>
          <p>We may preserve or disclose your information if we believe that it is reasonably necessary to comply with
            a law, regulation, legal process, or governmental request.</p>

          <h4 id="with_whom_p4">And Nobody Else</h4>
          <p>We do not rent, sell, or give away any information to any unauthorized third-parties.</p>
        </section>
        <section>
          <h2 id="information_security">Information Security</h2>

          <p>We take appropriate security measures to protect against unauthorized access to or
            unauthorized alteration, disclosure or destruction of data.</p>

          <p>If we terminate your access to the Service, we may retain enough information to prevent you
            from signing up for the Service in the future.</p>
        </section>
        <section>
          <h2 id="your_choices">Your Choices</h2>

          <p>We respect user privacy rights and will delete or provide all your user data we have stored on you upon request.</p>
          <ul>
            <li><strong>Access Data:</strong> To access all your user data, visit the <a href="/settings/user-data.json">/settings/user-data.json</a> page while logged in.</li>
            <li><strong>Revoke Data:</strong> To have your user data deleted, please <a href="/contact">contact us</a>.</li>
          </ul>
        </section>
        <section>
          <h2 id="changes">Changes</h2>

          <p>We may revise this Privacy Policy from time to time, the most recent version will always be at
            <a href="/privacy">{{ env.WEB_DOMAIN }}/privacy</a>.
            If a revision meaningfully reduces your rights, we will notify you.</p>
        </section>
        <section>
          <h2 id="contact">Contact</h2>

          <div class="info-notice">If you have any questions about this Privacy Policy, please <a href="/contact">contact us</a>.</div>
        </section>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { useTrace } from '../../middleware/request/tracer.ts';
import { SITE_SHORT_TITLE, SITE_TITLE } from '../../loadenv.ts';

const { env } = useTrace();
</script>
