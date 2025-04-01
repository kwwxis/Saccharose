import { throttle } from '../../shared/util/genericUtil.ts';

(() => {
  function randomIntFromInterval(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  document.addEventListener('mousemove', throttle(e => {
    const el = document.createElement('div');
    el.classList.add('cursor-trail');
    el.style.left = (e.pageX + randomIntFromInterval(-25,25)) + 'px';
    el.style.top = (e.pageY + randomIntFromInterval(-25,25)) + 'px';

    document.body.append(el);
    requestAnimationFrame(() => {
      el.style.opacity = '0.5';
      requestAnimationFrame(() => {
        el.style.opacity = '0';
        setTimeout(() => {
          el.remove();
        }, 1500);
      });
    });
  }, 200));
})();
