import { Listener } from '../../util/eventListen.ts';

export const BodyKeyEvents: Listener[] = [
  {
    selector: document,
    event: 'keydown',
    handle: function(e: KeyboardEvent) {
      if (e.key === 'Shift') {
        document.body.classList.add('keydown-shift');
      } else if (e.key === 'Control') {
        document.body.classList.add('keydown-control');
      } else if (e.key === 'Alt') {
        document.body.classList.add('keydown-alt');
      } else if (e.key === 'Meta') {
        document.body.classList.add('keydown-meta');
      }
    }
  },
  {
    selector: document,
    event: 'keyup',
    handle: function(e: KeyboardEvent) {
      if (e.key === 'Shift') {
        document.body.classList.remove('keydown-shift');
      } else if (e.key === 'Control') {
        document.body.classList.remove('keydown-control');
      } else if (e.key === 'Alt') {
        document.body.classList.remove('keydown-alt');
      } else if (e.key === 'Meta') {
        document.body.classList.remove('keydown-meta');
      }
    }
  }
];
