import { pageMatch } from '../../../core/pageMatch.ts';
import { Marker } from '../../../../shared/util/highlightMarker.ts';
import { highlightWikitext } from '../../../core/ace/aceHighlight.ts';
import { frag } from '../../../util/domutil.ts';

pageMatch('vue/VuePageTest', () => {
  const testEl: HTMLElement = document.getElementById('my-test');

  testEl.append(
    highlightWikitext({
      id: 'my-wikitext',
      text:
        `:This [[display]] goes at the front of the shop, and the details of the charity sale are pasted upon it, along with ` +
        `the cause to which the proceeds will go. Other than the aforementioned information, there is another important thing ` +
        `here that has to be conveyed to potential customers &mdash; items that are on sale!<br />"After much discussion with Paimon, ` +
        `we came to an important decision."<br />"To fire everyone up to support this charity sale, the snacks on offer at Favonian ` +
        `Goodies will be cheaper than that of normal stalls all across the board, so in a manner of speaking, everything here is on sale!"\n`
        + `:Hello World!`,
      gutters: true,
      markers: [
        new Marker('highlight', 1, 1 ,1),
        new Marker('asdf', 1, 1 ,3, {'style.color': 'red'}),
        new Marker('asdf', 1, 1 ,5, {'style.text-decoration': 'underline'}),
        new Marker('asdf', 1, 11 ,19, {'style.color': 'blue'}),
        new Marker('thing', 1, 372 ,372 + 9,
          {'style.color': 'green', 'style.text-decoration': 'underline', 'style.font-weight': 'bold'}),
        new Marker('blah', 2, 7, 7 + 6, {'style.color': 'orange'}),
      ]
    })
  );

  testEl.append(
    frag(`
        <button class="secondary small plus" ui-tippy-hover="Increase indent"
                ui-action="wikitext-indent: #my-wikitext, increase">+Indent</button>
        <button class="secondary small minus" ui-tippy-hover="Decrease indent"
                ui-action="wikitext-indent: #my-wikitext, decrease">-Indent</button>
    `)
  )
});
