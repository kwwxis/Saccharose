import { humanTiming, timeConvert } from '../../../shared/util/genericUtil.ts';

export function timestampInterval() {
  document.querySelectorAll<HTMLElement>('.timestamp.is--formatted.is--unconverted').forEach(el => {
    el.classList.remove('is--unconverted');
    el.classList.add('is--converted');
    el.innerText = timeConvert(parseInt(el.getAttribute('data-timestamp')), el.getAttribute('data-format') || null);
  });

  document.querySelectorAll<HTMLElement>('.timestamp.is--humanTiming').forEach(el => {
    el.innerText = humanTiming(parseInt(el.getAttribute('data-timestamp')));
  });
}
