import { VoAppState } from './vo-tool';
import Sortable, { SortableEvent } from 'sortablejs';
import { createVoHandles, VoGroup, VoHandle } from '../../../shared/vo-tool/vo-handle';
import { MwTemplateNode } from '../../../shared/mediawiki/mwTypes';
import { escapeHtml, romanize } from '../../../shared/util/stringUtil';
import { createPlaintextContenteditable } from '../../util/domutil';

const sortableDefaultOptions: Sortable.Options = {
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

export function VoAppEditor(state: VoAppState) {
  let storyHandle: VoHandle;
  let combatHandle: VoHandle;

  let storyStorable: Sortable = initSortableGroups('story', '#vo-story-groups');
  let combatSortable: Sortable = initSortableGroups('combat', '#vo-combat-groups');
  let dragHandleHtml: string = document.querySelector('#drag-handle-template').innerHTML;

  function initSortableGroups(type: 'story' | 'combat', selector: string): Sortable {
    let parent: HTMLElement = document.querySelector(selector);
    return new Sortable(parent, {
      ... sortableDefaultOptions,
      group: 'vo-'+type+'-groups',
      draggable: '.vo-group',
      onStart(_event: SortableEvent) {
        document.body.classList.add('vo-dragging');
        document.body.classList.add('vo-group-dragging');
      },
      onEnd(event: SortableEvent) {
        document.body.classList.remove('vo-dragging');
        document.body.classList.remove('vo-group-dragging');

        let handle = type === 'story' ? storyHandle : combatHandle;
        let voGroupEl = event.item;
        let oldIndex = event.oldDraggableIndex;
        let newIndex = event.newDraggableIndex;

        console.log('[VO-App] VO-Group, Drag End:', {voGroupEl, oldIndex, newIndex});

        if (handle.groups[oldIndex].moveTo(newIndex)) {
          notifyWikitext(type);
        }
      }
    });
  }

  function initSortableItemGroups(type: 'story' | 'combat', voGroupItemsEl: HTMLElement) {
    function dragEnd(el: HTMLElement) {
      el.style.removeProperty('height');
      let parentGroup = el.closest('.vo-group');
      if (el.querySelectorAll('.vo-item').length) {
        parentGroup.classList.remove('empty-group');
      } else {
        parentGroup.classList.add('empty-group');
      }
    }
    new Sortable(voGroupItemsEl, {
      ... sortableDefaultOptions,
      group: 'vo-items',
      draggable: '.vo-item',
      handle: '.drag-handle',
      onStart(event: SortableEvent) {
        document.body.classList.add('vo-dragging');
        document.body.classList.add('vo-item-dragging');
        event.from.style.height = event.from.getBoundingClientRect().height+'px';
      },
      onEnd(event: SortableEvent) {
        document.body.classList.remove('vo-dragging');
        document.body.classList.remove('vo-item-dragging');

        let handle = type === 'story' ? storyHandle : combatHandle;
        let voItemEl = event.item;
        let fromEl = event.from;
        let toEl = event.to;
        let oldIndex = event.oldDraggableIndex;
        let newIndex = event.newDraggableIndex;

        dragEnd(fromEl);
        dragEnd(toEl);
        console.log('[VO-App] VO-Item, Drag End:', {voItemEl, fromEl, toEl, oldIndex, newIndex});

        let fromGroup: VoGroup = handle.byUUID(fromEl.closest('.vo-group').id);
        let toGroup: VoGroup = handle.byUUID(toEl.closest('.vo-group').id);
        if (fromGroup.items[oldIndex].moveTo(newIndex, toGroup)) {
          notifyWikitext(type);
        }
      }
    });
  }

  function reload(type: 'story' | 'combat') {
    let voHandle: VoHandle = type === 'story' ? storyHandle : combatHandle;
    let sortable: Sortable = type === 'story' ? storyStorable : combatSortable;
    let parent: HTMLElement = type === 'story' ? document.querySelector('#vo-story-groups') : document.querySelector('#vo-combat-groups');
    parent.innerHTML = '';

    for (let group of voHandle.groups) {
      parent.insertAdjacentHTML('beforeend', `   
      <div id="${group.uuid}" class="vo-group">
        <div class="vo-group-header">
          <span class="drag-handle">${dragHandleHtml}</span>
        </div>
        <div class="vo-group-body">
          <div class="vo-group-items">
          </div>
        </div>
      </div>
    `);

      let groupEl: HTMLElement = document.getElementById(group.uuid);
      let voGroupHeaderEl: HTMLElement = groupEl.querySelector('.vo-group-header');
      let voGroupItemsEl: HTMLElement = groupEl.querySelector('.vo-group-items');

      let groupTitleInput = createPlaintextContenteditable({
        class: 'vo-group-header-title seamless-input',
        id: group.title.uuid
      });
      groupTitleInput.innerText = group.title.text;

      groupTitleInput.addEventListener('blur', () => {
        group.title.text = groupTitleInput.innerText;
        notifyWikitext(type);
      });

      voGroupHeaderEl.append(groupTitleInput);

      let i = 1;
      for (let item of group.items) {
        voGroupItemsEl.insertAdjacentHTML('beforeend', `
          <div id="${item.uuid}" class="vo-item">
            <div class="vo-item-header">
              <span class="drag-handle">${dragHandleHtml}</span>
            </div>
          </div>
        `);

        let itemEl: HTMLElement = document.getElementById(item.uuid);
        let itemHeaderEl: HTMLElement = itemEl.querySelector('.vo-item-header');

        if (type === 'story') {
          let itemTitleInput = createPlaintextContenteditable({
            class: 'vo-group-header-title seamless-input',
            id: group.title.uuid
          });
          itemTitleInput.innerText = item.getParam('title');

          itemTitleInput.addEventListener('blur', () => {
            item.setParam('title', itemTitleInput.innerText);
            notifyWikitext(type);
          });

          itemHeaderEl.append(itemTitleInput);
        } else {
          let span = document.createElement('span');
          span.innerText = group.title.text + ': ' + romanize(i);
          itemHeaderEl.append(span);
        }

        i++;
      }

      initSortableItemGroups(type, voGroupItemsEl);
    }
  }

  function notifyWikitext(type: 'story' | 'combat') {
    let voHandle: VoHandle = type === 'story' ? storyHandle : combatHandle;
    state.eventBus.emit('VO-Wikitext-SetFromVoHandle', voHandle);
  }

  function initEvents() {
    state.eventBus.on('VO-Editor-RequestHandle', (type: 'story' | 'combat', cb: (value: VoHandle) => void) => {
      if (type === 'story') {
        cb(storyHandle)
      }
      if (type === 'combat') {
        cb(combatHandle);
      }
    });

    state.eventBus.on('VO-Editor-Reload', (wikitext: string) => {
      storyHandle = null;
      combatHandle = null;

      let handles = createVoHandles(wikitext);
      for (let handle of handles) {
        handle.compile();
        if (handle.isCombat) {
          combatHandle = handle;
        } else {
          storyHandle = handle;
        }
      }
      if (!storyHandle) {
        storyHandle = new VoHandle(new MwTemplateNode(state.isTraveler ? 'VO/Traveler' : 'VO/Story'));
      }
      if (!combatHandle) {
        combatHandle = new VoHandle(new MwTemplateNode(state.isTraveler ? 'VO/Combat' : 'Combat VO'));
      }

      console.log('[VO-App] VoHandle STORY:', storyHandle);
      console.log('[VO-App] VoHandle COMBAT:', combatHandle);

      (<any> window).storyHandle = storyHandle;
      (<any> window).combatHandle = combatHandle;

      reload('story');
      reload('combat');
    });
  }

  initEvents();
}