import { throttle } from '../../shared/util/genericUtil.ts';

(() => {
  document.addEventListener('mousemove', throttle(e => {
    const el = document.createElement('div');
    el.classList.add('cursor-trail');
    el.style.left = (e.pageX + 25) + 'px';
    el.style.top = (e.pageY - 25) + 'px';

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
