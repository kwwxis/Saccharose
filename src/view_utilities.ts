import config from '@/config';
import feather from 'feather-icons';
import createHtmlElement from 'create-html-element';

export function icon(iconName: string, props: any = {}): string {
  props.class = props.class ? (props.class = 'icon ' + props.class) : 'icon';
  return feather.icons[iconName].toSvg(props);
}

export function timestamp(ts: Date|number|string, format=null): string {
  if (ts instanceof Date)
    ts = ts.getTime() / 1000 | 0;
  if (typeof ts !== 'number')
    ts = 'n/a';
  if (!format)
    format = 'MMM DD YYYY hh:mm:ss a';
  return `<span class="timestamp is--formatted is--unconverted" data-timestamp="${ts}" data-format="${format}">${format}</span>`;
}

export function humanTiming(ts: Date|number): string {
  if (ts instanceof Date)
    ts = ts.getTime() / 1000 | 0;

  const now = Date.now() / 1000 | 0;

  if (typeof ts !== 'number')
    ts = now;

  let placeholder = ts > now ? 'some time from now' : 'some time ago';

  return `<span class="timestamp is--humanTiming" data-timestamp="${ts}">${placeholder}</span>`;
}

const uriKeyMap = Object.freeze({
  css: Object.freeze(['link', 'href', Object.freeze({rel: 'stylesheet'})]),
  js: Object.freeze(['script', 'src', Object.freeze({})]),
});

/**
 * @todo this can probably be cached
 * @param {string|object} attrib either string url (for href/src) or HTML attributes object
 * [must have either href (css) or src (js) property]
 * @param {string} type either `css` or `js`
 */
export function compileResourceElement(attrib: string|{ [attrName: string]: string|number|boolean }, type: string) {
  const [tagName, uriKey, defaultAttrib] = uriKeyMap[type];

  if (typeof attrib === 'string') { // assume is url
    attrib = {[uriKey]: attrib};
  } else {
    attrib = Object.assign({}, attrib);
  }

  if (!(<string> attrib[uriKey]).startsWith('http')) { // if not starts with 'http', assume internal resource
    attrib[uriKey] = `/${type}/${attrib[uriKey]}.${type}?v=${config.views.assetVersion}`; // add cache buster query param
  }

  return createHtmlElement({
    name: tagName,
    attributes: Object.assign({}, defaultAttrib, attrib),
  });
}