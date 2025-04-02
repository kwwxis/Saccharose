<template>
  <section id="landing-header" class="card">
    <div class="posRel">
      <div class="bg"></div>
      <div class="bg2"></div>
      <img src="/images/site/logo/Genshin-Impact-Logo-White.webp" />
    </div>
    <h2><span>{{ SITE_TITLE }}</span><br><small>Genshin Impact Wiki Tools</small></h2>
    <div class="divider"></div>
  </section>
  <section class="card">
    <div class="content">
      <h4>Welcome</h4>
      <p>Check out the tools in the sidebar to the right to get started.</p>
    </div>
  </section>
  <section class="card">
    <h2 style="text-align: center">Rebranding to "nickjr.wiki" is cancelled</h2>
    <div class="content">
      <p class="spacer15-bottom" style="font-size: 16px;line-height: 25px;max-width: 650px;margin: 0 auto;">After careful consideration, I have decided to revert <strong>nickjr.wiki</strong> back to
        <strong>saccharose.wiki</strong> &mdash; not because it wasn't a perfect name, but because it was <em>too</em> perfect.</p>

      <p class="spacer15-bottom" style="font-size: 16px;line-height: 25px;max-width: 650px;margin: 0 auto;">The sheer power of the name <strong>nickjr.wiki</strong> was simply too much for the
        mortal realm to handle. The very fabric of wiki editing reality began to warp under its weight.
        Users reported an overwhelming sense of awe upon visiting the site, with some claiming they could hear
        an ethereal chorus chanting <strong>"SolarMist"</strong> and <strong>"nickjr"</strong> in the background.
        A few brave souls tried to use the tool as usual, but found themselves paralyzed by the sheer magnitude of its new identity.</p>

      <p style="font-size: 16px;line-height: 25px;max-width: 650px;margin: 0 auto;">In the end, I realized that humanity is not yet ready for <strong>nickjr.wiki</strong>. Perhaps one day,
        when our collective understanding of wiki editing has evolved to a higher plane of existence, the world will
        once again be worthy of its glory. Until then, we humbly return to <strong>saccharose.wiki</strong>, a name more suited
        to the fragile constraints of mortal comprehension.</p>
    </div>
  </section>
  <section id="landing-feedback" class="card">
    <h2>Ideas and Bug Reports</h2>
    <div class="content">
      <img src="/images/site/home/Icon_Emoji_017_Sucrose_OK.webp" class="fr" style="width:80px; margin-top: -40px;" loading="lazy" decoding="async" />
      <p>If you have ideas for additional tools for this website or found any bugs, you can message the
        "{{ SITE_TITLE }}" editing forums post in the Wiki Discord.
        Or if you're one of the interwiki editors and aren't in the English wiki discord, you can ping or DM kwwxis.</p>
    </div>
  </section>
  <section id="landing-changelog" class="card">
    <h2>Changelog</h2>
    <div class="content">
      <img src="/images/site/home/Icon_Emoji_019_Sucrose_Doubt_Flipped.webp" class="fr" style="width:80px; margin-top: -40px" loading="lazy" decoding="async" />
      <ul>
        <li><strong>2024-01-31:</strong> Updated to Genshin 4.4 data.</li>
        <li><strong>2024-01-28:</strong> Special Food Recipe are now shown in Item page as applicable.</li>
        <li><strong>2024-01-28:</strong> Added recipes in wikitext format to Item pages.</li>
        <li><strong>2024-01-28:</strong> Added Terms of Service and Privacy Policy pages.</li>
        <li><strong>2024-01-27:</strong> Locked down site to now require authentication.</li>
        <li><strong>2024-01-16:</strong> Initial release of Wiki Revisions tool.</li>
        <li><strong>2024-01-11:</strong> Overhauled how text markers work for highlighting and such. No noticeable impact to the
          user, but makes things significantly easier to have more features than before.</li>
        <li><strong>2024-01-11:</strong> Fixed issue with copying text in Excel Viewer.</li>
        <li><strong>2023-12-29:</strong> Excel Viewer now remembers your column preferences: the order, visibility, and widths of columns.</li>
        <li><strong>2023-12-24:</strong> Fixed an issue with <code>dialogTraceBack</code>, an internal function that's crucial for
          dialogue searching, where it did not correctly handle dialogue affected by InterActions.</li>
        <li><strong>2023-12-23:</strong> Fixed more Character VO Tool Visual Editor bugs.</li>
        <li><strong>2023-12-23:</strong> Delete buttons now added for locally saved characters in Character VO Tool.</li>
        <li><strong>2023-12-23:</strong> Added support to search for only voiced dialogue in Single Branch Dialogue Generator tool.</li>
        <li><strong>2023-12-22:</strong> Fixed multiple Character VO Tool Visual Editor bugs.</li>
        <li><strong>2023-12-22:</strong> Fixed issue with furnishing category filters not working.</li>
        <li><strong>2023-12-22:</strong> Fixed a dialogue generation bug.</li>
        <li><strong>2023-12-22:</strong> Improved performance of TCG pages and furnishing pages (somewhat).</li>
        <li><strong>2023-12-21:</strong> Added Furnishing Sets page.</li>
        <li><strong>2023-12-21:</strong> Added direct link to search pages for Achievements and Tutorials in sidebar.</li>
        <li><strong>2023-12-20:</strong> Updated to Genshin 4.3 data.</li>
        <li><strong>2023-12-20:</strong> Fixed more TCG issues.</li>
        <li><strong>2023-12-20:</strong> Fixed copying images in Excel Viewer.</li>
        <li><strong>2023-12-20:</strong> Tutorial transclude text updated.</li>
        <li><strong>2023-12-19:</strong> Fixed various TCG text generation issues.</li>
        <li><strong>2023-12-18:</strong> Fixed issue with "Chinese Traditional" not being displayed correctly in input language mismatch guess.</li>
        <li><strong>2023-12-10:</strong> Support for custom <WikiTemplateLink name="DIcon" />'s has been added.</li>
        <li><strong>2023-12-09:</strong> Added floating buttons next to dialogue to copy the line or show OL for that particular dialogue line.
          When the floating OL button is clicked, it'll open a panel within the page.</li>
        <li><strong>2023-12-09:</strong> Added Tutorials search.</li>
        <li><strong>2023-12-01:</strong> Excel Viewer interface updated to be mildly more useful.</li>
        <li><strong>2023-11-26:</strong> The placement of quest item images are now inserted into dialogue results with a <WikiTemplateLink name="tx" />,
          however determining which image it is isn't possible unfortunately.</li>
        <li><strong>2023-11-26:</strong> Quest Still images are now shown in quest/dialogue results as applicable.</li>
        <li><strong>2023-11-26:</strong> {{ SITE_SHORT_TITLE }} now can correctly determine if a player dialogue line is a Traveler spoken line
          or a dialogue option.</li>
        <li><strong>2023-11-26:</strong> InterActions are now incorporated into {{ SITE_SHORT_TITLE }} dialogue results.</li>
        <li><strong>2023-11-24:</strong> Improved support for showing the Matched Object in Identifier Usages.</li>
        <li><strong>2023-11-24:</strong> Identifier Usages in TextMap Search no longer opens in new tab but instead now loads inline.</li>
        <li><strong>2023-11-23:</strong> Fixed issue with searching for text that includes multiple periods.</li>
        <li><strong>2023-11-17:</strong> Added new "As Dialogue" tab to Readable results.</li>
        <li><strong>2023-11-17:</strong> Fixed issue with handling new lines in Readable text in "As Template" format.</li>
        <li><strong>2023-11-17:</strong> Fixed issue with VO File to Dialogue tool not showing text for Reminders.</li>
        <li><strong>2023-11-14:</strong> TextMap Search and Single Branch Dialogue Generator will now suggest checking your
          input language if there is no match and the language of the search text is different from the input language.</li>
        <li><strong>2023-11-14:</strong> Travel log summarization text is now automatically incorporated into dialogue sections.</li>
        <li><strong>2023-11-14:</strong> Overhauled UI for showing a readable. Added tabs for "Text",
          "As Template", and "Images" if applicable.</li>
        <li><strong>2023-11-11:</strong> Textmap Search now highlights search matches.</li>
        <li><strong>2023-11-11:</strong> Added "title" parameter to achievement infoboxes for achievements that have tiers.</li>
        <li><strong>2023-11-11:</strong> Enemy pages updated to show alternative descriptions and archive art.</li>
        <li><strong>2023-11-08:</strong> Updated to Genshin 4.2 data.</li>
        <li><strong>2023-11-08:</strong> Passive OL and passive text added to weapons pages.</li>
        <li><strong>2023-11-05:</strong> Fixed two dialogue fetching issues.</li>
        <li><strong>2023-11-05:</strong> The dialogue section title "Oprhaned Dialogue" is changed to now say
          "Non-Talk Dialogue" and the info tooltip text was corrected.</li>
        <li><strong>2023-11-05:</strong> Added automatic merging of MC text when needed.</li>
        <li><strong>2023-11-03:</strong> Restored ability to ctrl/command-click on links and templates in wikitext
          (was temporarily disabled due to bug).</li>
        <li><strong>2023-10-14:</strong> Added support for delicious/suspicious images for food items.</li>
        <li><strong>2023-10-08:</strong> Added living beings and enemy pages.</li>
        <li><strong>2023-10-08:</strong> Item pages now show archive text if the item has archive text.</li>
        <li><strong>2023-10-07:</strong> Added dialogue to TCG Stages.</li>
        <li><strong>2023-10-07:</strong> Released TCG Stages.</li>
        <li><strong>2023-10-05:</strong> Genshin Excel Viewer can now show certain images.</li>
        <li><strong>2023-10-05:</strong> ndashes (en dash) are now converted to <code>&ndash;</code> HTML entity in wikitext outputs.</li>
        <li><strong>2023-10-01:</strong> Readable pages now have a link to corresponding item/weapon page and item pages now show
          the corresponding readable text and link if there is one.</li>
        <li><strong>2023-10-01:</strong> Readables search improved to allow searching on both item names and document titles</li>
        <li><strong>2023-10-01:</strong> Readables list now also shows document titles</li>
        <li><strong>2023-09-26:</strong> Updated to Genshin 4.1 data.</li>
        <li><strong>2023-09-07:</strong> NPC Dialogue generator now groups by quests; and also groups non-talk under its appropriate quest as well; and also shows reminders from that NPC if applicable.</li>
        <li><strong>2023-08-22:</strong> Added achievements search.</li>
        <li><strong>2023-08-15:</strong> Updated to Genshin 4.0 data.</li>
        <li><strong>2023-08-12:</strong> Added ability to ctrl/command-click on links and templates in wikitext results to open wiki link in new tab.</li>
        <li><strong>2023-08-12:</strong> Added option to OL generator to include the section header.</li>
        <li><strong>2023-08-11:</strong> Added ability to search on raw textmap.</li>
        <li><strong>2023-08-11:</strong> Fixed unnecessary nested bolds/italics and fixed wikitext syntax highlighter crashing on certain bold/italic quote combinations.</li>
        <li><strong>2023-07-16:</strong> Added "Furnishings" pages.</li>
        <li><strong>2023-07-04:</strong> Updated to Genshin 3.8 data.</li>
        <li><strong>2023-05-24:</strong> Updated to Genshin 3.7 data.</li>
        <li><strong>2023-05-06:</strong> Added "Remove RM" and "Remove TL" buttons to Other Languages textareas.</li>
        <li><strong>2023-05-06:</strong> Added quick jump section to "NPC Dialogue" tool results.</li>
        <li><strong>2023-04-16:</strong> Added similar dialogue groups for quests.</li>
        <li><strong>2023-04-15:</strong> OL Generator now has warnings for potentially unhandled special codes.</li>
        <li><strong>2023-04-11:</strong> Updated to Genshin 3.6 data.</li>
        <li><strong>2023-04-11:</strong> OL input no longer clears after search and instead there is an X-button to clear and focus the input.</li>
        <li><strong>2023-04-08:</strong> Improved search for male/female Traveler text.</li>
        <li><strong>2023-04-08:</strong> Added ability to include the language and search mode settings in a direct link.</li>
        <li><strong>2023-03-25:</strong> Added "Weapons" and "Items" pages (WIP).</li>
        <li><strong>2023-03-25:</strong> The "Text Map Expansion" tool was renamed to "TextMap Search."</li>
        <li><strong>2023-03-18:</strong> Added support in "Text Map Expansion" tool to load more results.</li>
        <li><strong>2023-03-16:</strong> Improved regex searching.</li>
        <li><strong>2023-03-11:</strong> Added more images for various stuff.</li>
        <li><strong>2023-03-08:</strong> Improvement <WikiTemplateLink name="MC" /> template word expansion</li>
        <li><strong>2023-03-02:</strong> Added "Character VO Tool" page.</li>
        <li><strong>2023-03-02:</strong> Added "Loading Tips" list.</li>
        <li><strong>2023-03-01:</strong> Updated to Genshin 3.5 data.</li>
        <li><strong>2023-02-26:</strong> Converted "Achievements", "Tutorials", and "Viewpoints" pages to have a separate sub-page for each category.</li>
        <li><strong>2023-02-24:</strong> Added "Achievements" list.</li>
        <li><strong>2023-02-24:</strong> Added number of results for "Text Map Expansion", "Other Languages Generator", "ID Usages", and "Search Readables" pages.</li>
        <li><strong>2023-02-11:</strong> Added custom file format support to "Tutorials" and "Viewpoints" lists.</li>
        <li><strong>2023-01-27:</strong> Highlight ranges in wikitext now match the specific text rather than the whole line.</li>
        <li><strong>2023-01-27:</strong> The "Search Readables" tool now shows the matched readable text and can search readable titles.</li>
        <li><strong>2023-01-26:</strong> Fixed Talk dialogue section display to distinguish between Quest ID and Activity ID.</li>
        <li><strong>2023-01-26:</strong> Fixed "Quest Dialogue" tool to not load Activity Talks.</li>
        <li><strong>2023-01-25:</strong> Added "Tutorials" list.</li>
        <li><strong>2023-01-25:</strong> Added "Viewpoints" list.</li>
        <li><strong>2023-01-22:</strong> Added "Search Readables" tool.</li>
        <li><strong>2023-01-22:</strong> Talks now show quest conditions.</li>
        <li><strong>2023-01-22:</strong> Quest ID and NPC ID properties in dialogue sections now have tooltips of the quest or NPC name.</li>
        <li><strong>2023-01-22:</strong> Fixed issue with Ctrl-A and Ctrl-C in wikitext textareas adding an extra empty line at the end and start.</li>
        <li><strong>2023-01-22:</strong> Added quest characters list of quest generate result.</li>
        <li><strong>2023-01-17:</strong> Updated to Genshin 3.4 data.</li>
        <li><strong>2023-01-13:</strong> New "ID Usages" tool.</li>
        <li><strong>2023-01-13:</strong> Improved backend/scripts/importer performance.</li>
        <li><strong>2023-01-10:</strong> The "Single Branch Dialogue" tool would only load a talk if the user entered either the ID of the talk or the text for the first dialogue line of the talk.
          Now it will always show the talk(s) corresponding to a dialogue line. If the dialogue line is not part of any talk, then it'll also load previous dialogue lines in addition to subsequent lines.
        </li>
        <li><strong>2023-01-10:</strong> Implemented highlighting range support in wikitext.</li>
        <li><strong>2023-01-10:</strong> The "Single Branch Dialogue" tool used to falsely assume that the same DialogExcelConfigData ID
          cannot be part of multiple talks. It has been fixed to load all talks associated with a DialogExcelConfigData.</li>
        <li><strong>2023-01-05:</strong> Added "Books &amp; Readables" list.</li>
        <li><strong>2022-12-31:</strong> Can now choose search mode in "Text Map Expansion", "Single Branch Dialogue", and "Reminder Dialogue" tools. Regex support included.</li>
        <li><strong>2022-12-21:</strong> Wikitext is now highlighted.</li>
        <li><strong>2022-12-21:</strong> Added "TCG Talk Detail" and "TCG Tutorial Text" lists.</li>
        <li><strong>2022-12-21:</strong> Added expand/collapse button to dialogue sections.</li>
        <li><strong>2022-12-15:</strong> OL generator tool now highlights different values for the same parameter key across multiple results for the same input.</li>
        <li><strong>2022-12-12:</strong> Internal improvements to "Single Branch Dialogue" tool.</li>
        <li><strong>2022-12-12:</strong> OL generator tool now shows TextMap Hashes for results and can accept TextMap Hash as input.</li>
        <li><strong>2022-12-09:</strong> Added "VO File to Dialogue" tool.</li>
        <li><strong>2022-12-09:</strong> Made UI somewhat better in mobile.</li>
        <li><strong>2022-12-06:</strong> Added IT/TR language support.</li>
        <li><strong>2022-12-06:</strong> Updated to Genshin 3.3 data.</li>
        <li><strong>2022-12-04:</strong> Added favorite furnishing set names to Serenitea Pot Dialogue pages.</li>
        <li><strong>2022-12-04:</strong> Added quest rewards to quest pages.</li>
        <li><strong>2022-12-04:</strong> Added "Text Map Expansion" tool.</li>
        <li><strong>2022-12-04:</strong> Added "Chapters &amp; Acts" page.</li>
        <li><strong>2022-12-04:</strong> Reorganized Tools sidebar.</li>
        <li><strong>2022-11-20:</strong> Fixed bug in Quest Dialogue Generator tool relating to unsectioned talks.</li>
        <li><strong>2022-11-20:</strong> Character story lists now include quest requirement info and altered stories when applicable.</li>
        <li><strong>2022-11-20:</strong> Serenitea Pot Dialogue now includes favorite furnishing set rewards.</li>
        <li><strong>2022-11-20:</strong> Refactored code and made the frontend code less sad and pathetic. Previously frontend code
          was JavaScript, and now it is TypeScript with Webpack.</li>
        <li><strong>2022-11-04:</strong> Added <code>_rm</code> options to OL generator. OL generator will also now remember your option selection on page revisit.</li>
        <li><strong>2022-11-01:</strong> Updated to Genshin 3.2 data.</li>
        <li><strong>2022-10-30:</strong> The character <code>·</code> is now replaced with <code>・</code> for CJK in OL tables</li>
        <li><strong>2022-10-30:</strong> Add cutscene subtitles, when applicable, to quest generation results.</li>
        <li><strong>2022-10-30:</strong> Add travel log summarization, when found, to quest generation results.</li>
        <li><strong>2022-10-13:</strong> Wiki VO support added to reminders.</li>
        <li><strong>2022-10-04:</strong> If a voiced dialogue line does not contain <WikiTemplateLink name="MC" /> and has multiple VOs, then only the first VO <WikiTemplateLink name="A" /> will be shown and the rest will be commented out.</li>
        <li><strong>2022-10-02:</strong> Added <WikiTemplateLink name="MC" /> support to OL results.</li>
        <li><strong>2022-09-27:</strong> Updated to Genshin 3.1 data.</li>
        <li><strong>2022-09-24:</strong> Fixed bug with finding orphaned dialogue.</li>
        <li><strong>2022-09-19:</strong> Various UI improvements and clickable dialogue section metadata links.</li>
        <li><strong>2022-09-16:</strong> Various UI improvements.</li>
        <li><strong>2022-09-13:</strong> Wiki VO support for quest dialogue.</li>
        <li><strong>2022-09-05:</strong> Added support for multiple results to OL Generator tool.</li>
        <li><strong>2022-09-05:</strong> Added "NPC Dialogue Generator" tool.</li>
        <li><strong>2022-09-01:</strong> Fixed a caching issue that was showing results in the wrong language sometimes.</li>
        <li><strong>2022-08-30:</strong> Added "Reminder Dialogue Generator" tool and "All Reminder Dialogue" list.</li>
        <li><strong>2022-08-27:</strong> Added "Character Stories" and "Serenitea Pot Dialogue" lists</li>
        <li><strong>2022-08-25:</strong> Improvements to "Single Branch Dialogue Generator" tool.</li>
        <li><strong>2022-08-24:</strong> Various bug fixes.</li>
        <li><strong>2022-08-23:</strong> Updated to Genshin 3.0 data.</li>
        <li><strong>2022-08-23:</strong> Made improvements to how Next Talks are handled in the "Quest Dialogue Generator" tool.</li>
        <li><strong>2022-08-23:</strong> Fixed various bugs.</li>
        <li><strong>2022-08-22:</strong> Added "Single Branch Dialogue Generator" tool.</li>
        <li><strong>2022-08-21:</strong> Some improvements to "Quest Dialogue Generator" tool.</li>
        <li><strong>2022-08-03:</strong> Added light/dark mode buttons to header<br><small>(Dark mode will not persist if browser cookies are disabled)</small></li>
        <li><strong>2022-08-01:</strong> Added "Quest Dialogue Generator" tool</li>
        <li><strong>2022-07-31:</strong> Added "Other Languages Generator" tool</li>
      </ul>
    </div>
  </section>
</template>
<script setup lang="ts">
import WikiTemplateLink from '../utility/WikiTemplateLink.vue';
import { SITE_SHORT_TITLE, SITE_TITLE } from '../../loadenv.ts';
</script>
