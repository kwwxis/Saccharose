import { VoAppState } from './vo-tool.ts';
import Sortable, { SortableEvent } from 'sortablejs';
import {
  createVoHandle,
  createVoHandles,
  VoGroup,
  VoHandle,
  VoItem,
} from './vo-handle.ts';
import { MwParamNode, MwTemplateNode } from '../../../../shared/mediawiki/mwParseTypes.ts';
import { escapeHtml, romanize, ucFirst } from '../../../../shared/util/stringUtil.ts';
import { createElement, createPlaintextContenteditable, flashElement } from '../../../util/domutil.ts';
import { listen } from '../../../util/eventListen.ts';
import { flashTippy } from '../../../util/tooltipUtil.ts';
import { createWikitextEditor, getAceEditor } from '../../../core/ace/aceEditor.ts';
import { modalService } from '../../../util/modalService.ts';
import { VoAppPreloadInput } from './vo-preload-types.ts';

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

export function getIconHtml(icon: 'add' | 'trash' | 'chevron-up' | 'chevron-down' | 'drag-handle') {
  // These are hidden elements in SharedVoTool.vue
  let tpl = document.querySelector('#template-icon-' + icon);
  return tpl.innerHTML;
}

export async function VoAppVisualEditor(state: VoAppState): Promise<void> {
  if (!state.avatar)
    return;

  let storyHandle: VoHandle;
  let combatHandle: VoHandle;

  const storyStorable: Sortable = initSortableGroups('story', '#vo-story-groups');
  const combatSortable: Sortable = initSortableGroups('combat', '#vo-combat-groups');
  const dragHandleHtml: string = getIconHtml('drag-handle');

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
        let voItem: VoItem = fromGroup.items[oldIndex];

        if (voItem.moveTo(newIndex, toGroup)) {
          notifyWikitext(type);
        }

        if (type === 'combat') {
          toGroup.items.forEach(item => setCombatItemHeader(item));
        }
      }
    });
  }

  function getCombatItemHeader(item: VoItem) {
    let itemEl: HTMLElement = document.getElementById(item.uuid);
    let itemHeaderEl: HTMLElement = itemEl.querySelector('.vo-item-header');

    let span: HTMLSpanElement = itemHeaderEl.querySelector('span.input-style');
    if (!span) {
      span = setCombatItemHeader(item);
    }
    return span.innerText;
  }

  function setCombatItemHeader(item: VoItem): HTMLSpanElement {
    let itemEl: HTMLElement = document.getElementById(item.uuid);
    let itemHeaderEl: HTMLElement = itemEl.querySelector('.vo-item-header');
    let itemIndex: number = item.group.items.indexOf(item);

    let span: HTMLSpanElement = itemHeaderEl.querySelector('span.input-style');
    if (!span) {
      span = createElement('span', {class: 'input-style seamless-input no-hover'});
      itemHeaderEl.append(span);
    }
    span.innerText = item.group.title.text + ': ' + romanize(itemIndex + 1);
    return span;
  }

  function reload(type: 'story' | 'combat') {
    let voHandle: VoHandle = type === 'story' ? storyHandle : combatHandle;
    let sortable: Sortable = type === 'story' ? storyStorable : combatSortable;
    let parent: HTMLElement = type === 'story' ? document.querySelector('#vo-story-groups') : document.querySelector('#vo-combat-groups');

    // Reset to empty HTML
    parent.innerHTML = '';

    function addVisualGroupElement(group: VoGroup, relativeTo?: VoGroup, relativePos: 'above' | 'below' = 'above'): HTMLElement {
      // Create group HTML containers
      const groupContainerHTML = `   
        <div id="${group.uuid}" class="vo-group">
          <div class="vo-group-header">
            <span class="drag-handle">${dragHandleHtml}</span>
          </div>
          <div class="vo-group-body">
            <div class="vo-group-items">
            </div>
            <div class="vo-group-addItem">
              <button class="secondary">${getIconHtml('add')} <span class="spacer5-left">Add new item</span></button>
            </div>
          </div>
        </div>
      `;

      if (relativeTo) {
        let relativeGroup: HTMLElement = document.getElementById(relativeTo.uuid);
        relativeGroup.insertAdjacentHTML(relativePos === 'above' ? 'beforebegin' : 'afterend', groupContainerHTML);
      } else {
        parent.insertAdjacentHTML('beforeend', groupContainerHTML);
      }

      // Group container elements
      let groupEl: HTMLElement = document.getElementById(group.uuid);
      let voGroupHeaderEl: HTMLElement = groupEl.querySelector('.vo-group-header');
      let voGroupItemsEl: HTMLElement = groupEl.querySelector('.vo-group-items');
      let voItemAddButton: HTMLElement = groupEl.querySelector('.vo-group-addItem button');

      // Group title input
      let groupTitleInput = createPlaintextContenteditable({
        class: 'vo-group-header-title seamless-input',
        id: group.title.uuid
      });
      groupTitleInput.innerText = group.title.text;

      groupTitleInput.addEventListener('blur', () => {
        group.title.text = groupTitleInput.innerText;
        notifyWikitext(type);
        group.items.forEach(item => setCombatItemHeader(item));
      });

      voGroupHeaderEl.append(groupTitleInput);

      // Group header right-side
      voGroupHeaderEl.append(createElement('div', {class: 'grow'}));

      voGroupHeaderEl.insertAdjacentHTML('beforeend', `
        <div class="vo-group-add-buttons valign button-group">
          <span class="secondary-label">Add group:</span>
          <button class="vo-group-add-above secondary" ui-tippy="Above this group">${getIconHtml('chevron-up')}</button>
          <button class="vo-group-add-below secondary" ui-tippy="Below this group">${getIconHtml('chevron-down')}</button>
        </div>
      `);

      listen([
        {
          selector: '.vo-group-add-above',
          event: 'click',
          handle: () => {
            const currentGroupPos = voHandle.groups.indexOf(group);
            const newGroup = voHandle.newGroup();
            newGroup.title.text = 'New group';
            newGroup.moveTo(currentGroupPos);

            let newGroupEl = addVisualGroupElement(newGroup, group, 'above');
            notifyWikitext(type);
            console.log('[VO-App] Group added', { group: newGroup, groupEl: newGroupEl });
          }
        },
        {
          selector: '.vo-group-add-below',
          event: 'click',
          handle: () => {
            const currentGroupPos = voHandle.groups.indexOf(group);
            const newGroup = voHandle.newGroup();
            newGroup.title.text = 'New group';
            newGroup.moveTo(currentGroupPos + 1);

            let newGroupEl = addVisualGroupElement(newGroup, group, 'below');
            notifyWikitext(type);
            console.log('[VO-App] Group added', { group: newGroup, groupEl: newGroupEl });
          }
        },
      ], voGroupHeaderEl);

      let groupRemoveButton = createElement('button', {class: 'secondary vo-group-remove', html: getIconHtml('trash'), 'ui-tippy': 'Remove this group'});
      voGroupHeaderEl.append(groupRemoveButton);
      groupRemoveButton.addEventListener('click', () => {
        modalService.confirm(
          'Confirm removal',
          `
            <p>Are you sure you want to remove this group?</p>
            <p class="spacer10-top">Group to remove: <strong>${escapeHtml(group.title.text || '(Untitled group)')}</strong></p>
          `
        ).onConfirm(() => {
          console.log('[VO-App] Group removed', { group });
          group.remove();
          groupEl.remove();
          notifyWikitext(type);
          groupRemoveButton.blur();
        });
      });

      // Item Add Method
      function addVisualItemElement(item: VoItem): HTMLElement {
        // Create item HTML containers
        voGroupItemsEl.insertAdjacentHTML('beforeend', `
          <div id="${item.uuid}" class="vo-item">
            <div class="vo-item-header">
              <span class="drag-handle">${dragHandleHtml}</span>
            </div>
            <div class="vo-item-params"></div>
            <div class="vo-item-addParam">
              <select>
                <option value="null" disabled selected>New property</option>
              </select>
              <input type="text" class="hide" placeholder="Enter property name" />
              <button class="secondary small">Add</button>
            </div>
          </div>
        `);

        // Item container elements
        let itemEl: HTMLElement = document.getElementById(item.uuid);
        let itemHeaderEl: HTMLElement = itemEl.querySelector('.vo-item-header');
        let itemParamsEl: HTMLElement = itemEl.querySelector('.vo-item-params');
        let addParamEl: HTMLElement = itemEl.querySelector('.vo-item-addParam');
        let titlePropName: string = state.voLang.startsWith('CH') ? 'title_s' : 'title';
        let itemTitleInput: HTMLElement;

        // Item title input/display
        if (type === 'story') {
          itemTitleInput = createPlaintextContenteditable({
            class: 'vo-item-header-title seamless-input',
            id: group.title.uuid,
            'ui-tippy': JSON.stringify({content: `Same as "${titlePropName}" property`, delay: [500, 100]})
          });

          itemTitleInput.innerText = item.getParam(titlePropName) || '';

          itemTitleInput.addEventListener('blur', () => {
            const titleText: string = itemTitleInput.innerText;
            if (!item.hasParam(titlePropName) && !titleText) {
              return;
            }
            if (!item.hasParam(titlePropName)) {
              const paramNode = item.addParam(titlePropName, titleText);
              notifyWikitext(type);

              addVisualParamElement(titlePropName, paramNode, true);
            } else {
              item.setParam(titlePropName, titleText);
              notifyWikitext(type);

              const paramEl = itemEl.querySelector(`.vo-item-param[data-prop-name="${titlePropName}"]`);
              if (paramEl) {
                let propValueEditorEl: HTMLInputElement = paramEl.querySelector('.prop-value .ace_editor');
                getAceEditor(propValueEditorEl).setValue(titleText, -1);
              }
            }
          });

          itemHeaderEl.append(itemTitleInput);
        } else {
          setCombatItemHeader(item);
        }

        // Item header right-side
        itemHeaderEl.append(createElement('div', {class: 'grow'}));

        let itemRemoveButton = createElement('div', {class: 'vo-item-remove', html: getIconHtml('trash'), 'ui-tippy': 'Remove this item'});
        itemHeaderEl.append(itemRemoveButton);
        itemRemoveButton.addEventListener('click', () => {
          let itemTitle = type === 'combat' ? getCombatItemHeader(item) : item.getParam(titlePropName);
          modalService.confirm(
            'Confirm removal',
            `
              <p>Are you sure you want to remove this item?</p>
              <p class="spacer10-top">Item to remove: <strong>${escapeHtml(itemTitle || '(Untitled item)')}</strong></p>
            `
          ).onConfirm(() => {
            console.log('[VO-App] Item removed', { item });
            item.remove();
            itemEl.remove();
            notifyWikitext(type);
            itemRemoveButton.blur();
          });
        });

        const PARAM_VALUE_EDIT_MAX_LINES: number = 10; // max display lines before scrolling is enabled

        // Item params
        function addVisualParamElement(propName: string, paramNode: MwParamNode, isVisualAdd: boolean = false): HTMLElement {
          const paramDiv: HTMLElement     = createElement('div', {class: 'vo-item-param valign', 'data-prop-name': propName});
          const propNameEl: HTMLElement   = createElement('div', {class: 'prop-name', text: propName});
          const propValueEl: HTMLElement  = createElement('div', {class: 'prop-value grow'});
          const removeEl: HTMLElement     = createElement('span',{class: 'close small', 'ui-tippy': 'Delete property'});
          paramDiv.append(propNameEl, propValueEl, removeEl);

          const editorEl = createElement('div', {innerText: paramNode.value, class: 'input-style for-editor'});
          propValueEl.append(editorEl);

          setTimeout(() => {
            const propValueEditor = createWikitextEditor(editorEl);
            propValueEditor.renderer.setScrollMargin(5, 5, 5, 5);
            propValueEditor.renderer.setShowGutter(false);
            propValueEditor.setHighlightActiveLine(false);
            propValueEditor.setOption('fontSize', 13);
            propValueEditor.setOption('maxLines', PARAM_VALUE_EDIT_MAX_LINES);
            propValueEditor.setValue(paramNode.value, -1);

            propValueEditor.on('blur', (e) => {
              console.log(`[VO-App] Item param value change:`, { item, propName, paramNode });

              const newValue: string = propValueEditor.getValue();
              item.setParam(propName, newValue);
              notifyWikitext(type);

              if (propName === titlePropName && itemTitleInput) {
                itemTitleInput.innerText = newValue;
              }
            });

            removeEl.addEventListener('click', () => {
              if (item.numParams() === 1) {
                let itemTitle = type === 'combat' ? getCombatItemHeader(item) : item.getParam(titlePropName);
                modalService.confirm(
                  'Confirm removal',
                  `
                    <p>Removing every property from an item will delete it. Are you sure you want to delete this item?</p>
                    <p class="spacer10-top">Item that will be removed: <strong>${escapeHtml(itemTitle || '(Untitled item)')}</strong></p>
                  `
                ).onConfirm(() => {
                  item.remove();
                  itemEl.remove();
                  notifyWikitext(type);
                });
                return;
              }
              console.log(`[VO-App] Item param remove click:`, { item, propName, paramNode });
              item.removeParam(propName);
              propValueEditor.destroy();
              paramDiv.remove();
              notifyWikitext(type);
              if (propName === titlePropName) {
                itemTitleInput.innerText = '';
              }
            });
          });

          if (isVisualAdd) {
            const index = item.paramNodes.indexOf(paramNode);
            if (index === 0) {
              itemParamsEl.prepend(paramDiv);
              console.log('[VO-App] Item param added via VisualAdd (first-index)', { item, index });
            } else if (index === item.paramNodes.length - 1) {
              itemParamsEl.append(paramDiv);
              console.log('[VO-App] Item param added via VisualAdd (last-index)', { item, index });
            } else {
              const previous: MwParamNode = item.paramNodes[index - 1];
              const previousProp: string = item.getPropName(previous);
              const previousEl: HTMLElement = itemParamsEl.querySelector(`.vo-item-param[data-prop-name="${previousProp}"]`);
              previousEl.insertAdjacentElement('afterend', paramDiv);
              console.log('[VO-App] Item param added via VisualAdd (middle-index)', { item, index, previous, previousProp, previousEl });
            }
          } else {
            itemParamsEl.append(paramDiv);
          }

          return paramDiv;
        }

        for (let [propName, paramNode] of item.params) {
          addVisualParamElement(propName, paramNode);
        }

        // Add Param Form
        let addParamSelect: HTMLSelectElement = addParamEl.querySelector('select');
        let addParamTextInput: HTMLInputElement = addParamEl.querySelector('input[type=text]');

        function resetSelect(currentValue?: string) {
          addParamSelect.innerHTML = '';
          addParamSelect.append(createElement('option', {
            text: 'New property',
            disabled: true,
            selected: !currentValue || currentValue === 'null',
            value: 'null'
          }));
        }

        listen([
          {
            selector: 'select',
            event: 'change',
            handle: (ev: Event) => {
              ev.stopImmediatePropagation();
              let prop = addParamSelect.value;
              if (prop === 'custom') {
                addParamTextInput.classList.remove('hide');
              } else {
                addParamTextInput.classList.add('hide');
              }
            }
          },
          {
            selector: 'select',
            event: 'click',
            handle: () => {
              const currentValue = addParamSelect.value;
              const usedProps = Object.keys(item.propToParam);
              resetSelect();

              let optGroup0 = createElement('optgroup', {label: 'Custom'});
              optGroup0.append(createElement('option', {
                text: '(Custom property)',
                value: 'custom',
                selected: 'custom' === currentValue
              }));

              let optGroup1 = createElement('optgroup', {label: 'Properties'});
              let optGroup2 = createElement('optgroup', {label: 'S/T properties'});
              let optGroup3 = createElement('optgroup', {label: state.config.mainCharacterLabel + '-Specific'});

              for (let prop of state.config.enforcePropOrder) {
                if (usedProps.includes(prop)) {
                  continue;
                }
                let optionEl = createElement('option', {
                  text: prop,
                  value: prop,
                  selected: prop === currentValue,
                });
                if (/_male|_female|statue|waypoint/g.test(prop)) {
                  optGroup3.append(optionEl);
                } else {
                  prop.endsWith('_s') || prop.endsWith('_t') ? optGroup2.append(optionEl) : optGroup1.append(optionEl);
                }
              }

              addParamSelect.append(optGroup0);
              addParamSelect.append(optGroup1);
              addParamSelect.append(optGroup2);
              if (optGroup3.childElementCount) {
                addParamSelect.append(optGroup3);
              }
            }
          },
          {
            selector: 'button',
            event: 'click',
            handle: () => {
              let prop = addParamSelect.value;
              if (prop === 'custom') {
                prop = addParamTextInput.value.trim();
              }

              if (prop === 'null') {
                flashTippy(addParamSelect, {content: 'Choose a property first!', delay:[0,2000]})
                return;
              }
              if (!prop.length) {
                flashTippy(addParamTextInput, {content: 'Enter a property name', delay:[0,2000]})
                return;
              }
              if (!/^[a-zA-Z0-9\-_.\s]+$/.test(prop)) {
                flashTippy(addParamTextInput, {content: 'Contains invalid characters for property name', delay:[0,2000]})
                return;
              }

              // Add to handle
              console.log(`[VO-App] Item param added:`, { item, propName: prop });
              let paramNode = item.addParam(prop, '');
              notifyWikitext(type);

              // Add to visual editor (must come after adding to handle)
              let addedParamElement = addVisualParamElement(prop, paramNode, true);
              flashElement(addedParamElement);

              // Reset add-param form
              addParamTextInput.classList.add('hide');
              resetSelect();
            }
          }
        ], addParamEl);

        return itemEl;
      }

      // Item add button
      voItemAddButton.addEventListener('click', () => {
        let item = group.newItem();
        if (type === 'story') {

          if (state.voLang.startsWith('CH')) {
            item.setParam('title_s', '');
            item.setParam('title_t', '');
          } else {
            item.setParam('title', 'New item');
          }
          item.setParam('file', '');
        } else {
          item.setParam('tx', '');
          item.setParam('file', '');
        }

        let addedItemElement = addVisualItemElement(item);
        flashElement(addedItemElement);

        console.log('[VO-App] Item added', { item, itemEl: addedItemElement });

        notifyWikitext(type);
      });

      // Loop over items
      for (let item of group.items) {
        addVisualItemElement(item);
      }

      // Init sortable
      initSortableItemGroups(type, voGroupItemsEl);

      return groupEl;
    }

    // Loop over groups
    for (let group of voHandle.groups) {
      addVisualGroupElement(group);
    }
  }

  function notifyWikitext(type: 'story' | 'combat') {
    state.eventBus.emit('VO-Wikitext-SetFromVoHandle', type === 'story' ? storyHandle : combatHandle);
  }

  function initEvents() {
    state.eventBus.on('VO-Visual-RequestHandle', (type: 'story' | 'combat', cb: (value: VoHandle) => void) => {
      cb(type === 'story' ? storyHandle : combatHandle);
    });

    state.eventBus.on('VO-Visual-ReloadError', (mode: 'story' | 'combat', error: any, templateName: string) => {
      let errorEl = document.querySelector('#vo-app-visualEditorReloadError-' + mode);
      let groupsEl = document.querySelector('#vo-' + mode + '-groups');
      if (error && typeof error !== 'string') {
        error = String(error);
      }
      if (error) {
        console.error('[VO-App] VoHandle ('+mode+') compile error:', error);
        errorEl.querySelector('.content').innerHTML = `
          <p class="error-notice">${escapeHtml(error)}</p>
          <p>The <strong>${ucFirst(mode)} Groups</strong> area of the <strong>Editor</strong> tab will not function until you fix this issue in the
            <strong>${templateName ? '{{'+templateName+'}}' : 'VO ' + ucFirst(mode)}</strong> template within the <strong>Wikitext</strong> tab.</p>
        `;
        errorEl.classList.remove('hide');
        groupsEl.classList.add('vo-handle-errored');
      } else {
        errorEl.querySelector('.content').innerHTML = '';
        errorEl.classList.add('hide');
        groupsEl.classList.remove('vo-handle-errored');
      }
    });

    state.eventBus.on('VO-Visual-Reload', (wikitext: string) => {
      storyHandle = null;
      combatHandle = null;

      let handles: VoHandle[] = createVoHandles(wikitext, state.config);
      for (let handle of handles) {
        try {
          handle.compile();
          state.eventBus.emit('VO-Visual-ReloadError', handle.isCombat ? 'combat' : 'story', null, handle?.templateNode?.templateName);
        } catch (e) {
          handle.clear();
          state.eventBus.emit('VO-Visual-ReloadError', handle.isCombat ? 'combat' : 'story', e, handle?.templateNode?.templateName);
        }
        if (handle.isCombat) {
          combatHandle = handle;
        } else {
          storyHandle = handle;
        }
      }
      if (!storyHandle) {
        storyHandle = createVoHandle(new MwTemplateNode(state.config.preloadConfig.getTemplateName(
          new VoAppPreloadInput(state, 'story', null)
        )), state.config);
      }
      if (!combatHandle) {
        combatHandle = createVoHandle(new MwTemplateNode(state.config.preloadConfig.getTemplateName(
          new VoAppPreloadInput(state, 'combat', null)
        )), state.config);
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
