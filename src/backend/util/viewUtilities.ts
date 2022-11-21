import feather, { FeatherAttributes } from 'feather-icons';
import createHtmlElement from 'create-html-element';

export function icon(iconName: string, size?: number, props: FeatherAttributes = {}): string {
  props.class = props.class ? (props.class = 'icon ' + props.class) : 'icon';
  if (size) {
    props.width = size;
    props.height = size;
  }
  return feather.icons[iconName].toSvg(props);
}

export function TemplateLink(template: string): string {
  return '{{' + createHtmlElement({
    name: 'a',
    attributes: {
      href: 'https://genshin-impact.fandom.com/wiki/Template:' + template.replaceAll(' ', '_'),
      target: '_blank',
      style: 'text-decoration:none'
    },
    text: template
  }) + '}}';
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