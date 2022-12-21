import { VoAppState } from './vo-tool';
import Sortable from 'sortablejs';

export function VoAppEditor(state: VoAppState) {

  let defaultOptions: Sortable.Options = {
    scroll: true,
    animation: 150,
    fallbackOnBody: true,
    swapThreshold: 0.65,

    handle: '.drag-handle',
    ghostClass: "sortable-ghost",  // Class name for the drop placeholder
    chosenClass: "sortable-chosen",  // Class name for the chosen item
    dragClass: "sortable-drag",
    forceFallback: true,
  };

  new Sortable(document.querySelector('#vo-groups'), {
    ... defaultOptions,
    group: 'vo-groups',
    draggable: '.vo-group',
    onStart(event) {
      document.body.classList.add('vo-dragging');
      document.body.classList.add('vo-group-dragging');
    },
    onEnd(event) {
      document.body.classList.remove('vo-dragging');
      document.body.classList.remove('vo-group-dragging');
    }
  });

  document.querySelectorAll<HTMLElement>('.vo-group-items').forEach(nestedSortable => {
    new Sortable(nestedSortable, {
      ... defaultOptions,
      group: 'vo-items',
      handle: '.drag-handle',
      onStart(event) {
        document.body.classList.add('vo-dragging');
        document.body.classList.add('vo-item-dragging');
      },
      onEnd(event) {
        document.body.classList.remove('vo-dragging');
        document.body.classList.remove('vo-item-dragging');

        let voItem = event.item;
        let fromEl = event.from;
        let toEl = event.to;
        dragEnd(fromEl);
        dragEnd(toEl);
        console.log('Drag End', {voItem, fromEl, toEl});
      }
    });
  });

  function dragEnd(el: HTMLElement) {
    if (el.querySelectorAll('.vo-item').length) {
      el.classList.remove('empty-group');
    } else {
      el.classList.add('empty-group');
    }
  }
}