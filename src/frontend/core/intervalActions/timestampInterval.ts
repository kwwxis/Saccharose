import { humanTiming, HumanTimingOpts, timeConvert } from '../../../shared/util/genericUtil.ts';
import { toInt } from '../../../shared/util/numberUtil.ts';

export function timestampInterval() {
  document.querySelectorAll<HTMLElement>('.timestamp.is--formatted.is--unconverted').forEach(el => {
    el.classList.remove('is--unconverted');
    el.classList.add('is--converted');
    el.innerText = timeConvert(toInt(el.getAttribute('data-timestamp')), el.getAttribute('data-format') || null);
  });

  document.querySelectorAll<HTMLElement>('.timestamp.is--humanTiming').forEach(el => {
    let opts: HumanTimingOpts = {};

    if (el.hasAttribute('data-precision')) {
      opts.precision = toInt(el.getAttribute('data-precision'));
    }
    if (el.hasAttribute('data-currentTime')) {
      opts.currentTime = toInt(el.getAttribute('data-currentTime'));
    }
    if (el.hasAttribute('data-suffix')) {
      opts.suffix = String(el.getAttribute('data-suffix'));
    }
    if (el.hasAttribute('data-pastSuffix')) {
      if (typeof opts.suffix === 'string')
        opts.suffix = {past: opts.suffix, future: opts.suffix};
      if (!opts.suffix || typeof opts.suffix !== 'object')
        opts.suffix = {past: '', future: ''};
      opts.suffix.past = String(el.getAttribute('data-pastSuffix'));
    }
    if (el.hasAttribute('data-futureSuffix')) {
      if (typeof opts.suffix === 'string')
        opts.suffix = {past: opts.suffix, future: opts.suffix};
      if (!opts.suffix || typeof opts.suffix !== 'object')
        opts.suffix = {past: '', future: ''};
      opts.suffix.future = String(el.getAttribute('data-futureSuffix'));
    }
    if (el.hasAttribute('data-justNowText')) {
      opts.justNowText = String(el.getAttribute('data-justNowText'));
    }

    el.innerText = humanTiming(toInt(el.getAttribute('data-timestamp')), opts);
  });
}
