import { VoAppState } from './vo-tool';
import Sortable from 'sortablejs';

export function VoAppEditor(state: VoAppState) {
  // Loop through each nested sortable element
  document.querySelectorAll<HTMLElement>('.nested-sortable').forEach(nestedSortable => {
    new Sortable(nestedSortable, {
      scroll: true,
      group: 'nested',
      animation: 150,
      fallbackOnBody: true,
      swapThreshold: 0.65,

      handle: '.drag-handle',
      draggable: '.list-group-item',
      ghostClass: "sortable-ghost",  // Class name for the drop placeholder
      chosenClass: "sortable-chosen",  // Class name for the chosen item
      dragClass: "sortable-drag",
      forceFallback: true,
    });
  });
}