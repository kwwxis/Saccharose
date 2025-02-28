import { humanTiming, timeConvert } from '../../../shared/util/genericUtil.ts';
import { toInt } from '../../../shared/util/numberUtil.ts';

export function timestampInterval() {
  document.querySelectorAll<HTMLElement>('.timestamp.is--formatted.is--unconverted').forEach(el => {
    el.classList.remove('is--unconverted');
    el.classList.add('is--converted');
    el.innerText = timeConvert(toInt(el.getAttribute('data-timestamp')), el.getAttribute('data-format') || null);
  });

  document.querySelectorAll<HTMLElement>('.timestamp.is--humanTiming').forEach(el => {
    el.innerText = humanTiming(toInt(el.getAttribute('data-timestamp')));
  });
}
