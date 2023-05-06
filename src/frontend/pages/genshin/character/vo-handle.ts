// noinspection JSUnusedGlobalSymbols

import { MwComment, MwNode, MwParamNode, MwTemplateNode, MwWhiteSpace } from '../../../../shared/mediawiki/mwTypes';
import { mwParse } from '../../../../shared/mediawiki/mwParse';
import { isStringBlank, splitLimit, uuidv4 } from '../../../../shared/util/stringUtil';
import { arrayClosestNumber, arrayRemove, arraySum, sort } from '../../../../shared/util/arrayUtil';
import { isset } from '../../../../shared/util/genericUtil';
import { constrainNumber, isInt, toInt } from '../../../../shared/util/numberUtil';

interface VoParamKey {
  groupKey: string;
  itemKey: string;
  prop: string;
}

const enforcePropOrderItem = (item: string) => [item, item + '_s', item + '_t']
export const enforcePropOrder = [
  ... enforcePropOrderItem('title'),
  ... enforcePropOrderItem('subtitle'),
  ... enforcePropOrderItem('waypoint'),
  ... enforcePropOrderItem('statue'),
  ... enforcePropOrderItem('friendship'),
  ... enforcePropOrderItem('ascension'),
  ... enforcePropOrderItem('quest'),
  ... enforcePropOrderItem('hidden'),
  ... enforcePropOrderItem('file'),
  ... enforcePropOrderItem('file_male'),
  ... enforcePropOrderItem('file_female'),
  ... enforcePropOrderItem('tx'),
  ... enforcePropOrderItem('rm'),
  ... enforcePropOrderItem('tl'),
  ... enforcePropOrderItem('actualtx'),
  ... enforcePropOrderItem('actualrm'),
  ... enforcePropOrderItem('actualtl'),
  ... enforcePropOrderItem('mention')
];

export function obtainPropOrder(propName: string): number {
  propName = propName.toLowerCase();
  for (let i = 0; i < enforcePropOrder.length; i++) {
    if (propName === enforcePropOrder[i]) {
      return i;
    }
  }
  for (let i = 0; i < enforcePropOrder.length; i++) {
    if (propName.startsWith(enforcePropOrder[i])) {
      return i;
    }
  }
  return -1;
}

export class VoItem {
  // Parent ref:
  readonly handle: VoHandle;
  group: VoGroup;

  // Self info:
  readonly uuid: string;
  private _itemKey: string = null;
  propToParam: {[propName: string]: MwParamNode} = {};
  allNodes: MwNode[] = [];

  constructor(handle: VoHandle, voGroup: VoGroup) {
    this.uuid = handle.setUUID(this);
    this.handle = handle;
    this.group = voGroup;
  }

  isEmpty(): boolean {
    return !this.allNodes.length;
  }

  get position(): number {
    return this.group.items.indexOf(this);
  }

  get itemKey(): string {
    return this._itemKey;
  }

  set itemKey(newItemKey: string) {
    this._itemKey = newItemKey;
    this.processKeyChange();
  }

  get htmlId(): string {
    return (this.handle.isCombat ? 'combat_' : 'story_') + this._itemKey;
  }

  getParam(propName: string): string {
    if (this.propToParam[propName]) {
      return this.propToParam[propName].value;
    } else {
      return undefined;
    }
  }

  setParam(propName: string, newValue: string): MwParamNode {
    if (this.propToParam[propName]) {
      this.propToParam[propName].value = newValue;
      return this.propToParam[propName];
    } else {
      return this.addParam(propName, newValue);
    }
  }

  getPropName(paramNode: MwParamNode): string {
    return Object.entries(this.propToParam).find(p => p[1] === paramNode)?.[0];
  }

  get params(): [string, MwParamNode][] {
    return this.paramNodes.map(node => {
      return [this.getPropName(node), node];
    });
  }

  removeParam(propName: string): MwParamNode {
    if (!this.propToParam[propName]) {
      return null;
    }

    let paramNode = this.propToParam[propName];
    delete this.propToParam[propName];

    let allNodesIndex = this.allNodes.indexOf(paramNode);
    let eolNode = this.allNodes[allNodesIndex + 1];

    if (eolNode instanceof MwWhiteSpace && (eolNode.content === '\n' || eolNode.content === '\n\n')) {
      arrayRemove(this.allNodes, [eolNode]);
      this.handle.removeNode(eolNode);
    }

    arrayRemove(this.allNodes, [paramNode]);
    this.handle.removeNode(paramNode);

    this.handle.recalculate();
    return paramNode;
  }

  addParam(propName: string, newValue: string): MwParamNode {
    if (this.propToParam[propName]) {
      this.propToParam[propName].value = newValue;
      return;
    }
    let key = this.handle.compileKey({groupKey: this.group.groupKey, itemKey: this._itemKey, prop: propName});
    let propOrder = obtainPropOrder(propName);
    let paramNode = new MwParamNode('|', (key + ' ').padEnd(this.handle.keyPadLen, ' '));
    let eolNode = new MwWhiteSpace('\n');
    paramNode.beforeValueWhitespace = new MwWhiteSpace(' ');
    paramNode.value = newValue;

    let allNodesIndex = -1;
    let insertIndex = -1;

    const defaultToLast = () => {
      insertIndex = this.lastNodeIndex + 1;
      allNodesIndex = this.allNodes.length;
    };

    let paramNodes = this.paramNodes;
    if (propOrder < 0 || !paramNodes.length) {
      defaultToLast();
    } else {
      let map: {[order: number]: MwParamNode} = {};
      for (let i = 0; i < paramNodes.length; i++) {
        let otherNode = paramNodes[i];
        let otherNodeOrder = obtainPropOrder(this.handle.parseKey(otherNode.key).prop);
        if (otherNodeOrder >= 0) {
          map[otherNodeOrder] = otherNode;
        }
      }
      if (!Object.keys(map).length) {
        defaultToLast();
      } else {
        let closestOrder = arrayClosestNumber(Object.keys(map).map(toInt), propOrder);
        let closestNode = map[closestOrder];
        insertIndex = this.handle.indexOf(closestNode);
        allNodesIndex = this.allNodes.indexOf(closestNode);
        if (closestOrder < propOrder) {
          // If it's before, then we'll want to insert after the closestNode (previous sibling node)
          // If it's after, then we'll want to insert before the closestNode (next sibling node)
          insertIndex++;
          allNodesIndex++;
          if (this.allNodes[allNodesIndex] instanceof MwWhiteSpace) {
            // Increment again to go past the EOL whitespace of the closestNode (previous sibling node)
            insertIndex++;
            allNodesIndex++;
          }
        }
      }
    }

    this.propToParam[propName] = paramNode;
    this.allNodes.splice(allNodesIndex, 0, paramNode, eolNode);
    this.handle.insertNodes(insertIndex, [paramNode, eolNode]);

    this.handle.recalculate();
    return paramNode;
  }

  remove(): boolean {
    if (this.position < 0) {
      return false;
    }
    let allNodes = this.allNodes;
    for (let node of allNodes) {
      this.handle.removeNode(node);
    }
    arrayRemove(this.group.items, [this]);
    this.group.recalculate();
    return true;
  }

  moveTo(newPosition: number, targetGroup?: VoGroup): boolean {
    let newGroup = targetGroup || this.group;
    let oldGroup = this.group;
    let isSameGroup = newGroup === oldGroup;

    if (isSameGroup && newPosition === this.position) {
      return false;
    }

    if (newPosition < 0 || newPosition > newGroup.items.length) {
      throw 'Invalid new item position: ' + newPosition;
    }

    let allNodes = this.allNodes;
    this.remove();
    this.group = newGroup;

    let insertNodeIndex = this.insertIndexForItemPosition(newGroup, newPosition);

    this.handle.insertNodes(insertNodeIndex, allNodes);
    newGroup.items.splice(newPosition, 0, this);

    if (isSameGroup) {
      newGroup.recalculate();
    } else {
      oldGroup.recalculate();
      newGroup.recalculate();
    }
    return true;
  }

  private insertIndexForItemPosition(group: VoGroup, position: number) {
    let isEndPos = position >= group.items.length;
    let item = group.items[constrainNumber(position, 0, group.items.length - 1)];
    return isEndPos ? item.lastNodeIndex + 1 : item.firstNodeIndex;
  }

  recalculate() {
    if (!this.handle.compileDone) {
      return;
    }

    let itemNum = this.position + 1;
    if (isInt(this.itemKey)) {
      // Set '_itemKey' directly instead of using 'itemKey'
      // processKeyChange() is called at the end of this function, no need to call it twice.
      this._itemKey = this.handle.isCombat ? String(itemNum) : String(itemNum).padStart(2, '0');
    }

    let isLastItemOfGroup = this.position === this.group.items.length - 1;
    let isLastItemOfLastGroup = isLastItemOfGroup && this.group.position === this.handle.groups.length - 1;
    let newAllNodes = [];

    for (let i = 0; i < this.allNodes.length; i++) {
      let prevNode = i === 0 ? null : this.allNodes[i - 1];
      let thisNode = this.allNodes[i];
      let isLastNode = i === this.allNodes.length - 1;

      newAllNodes.push(thisNode);

      if (thisNode instanceof MwParamNode) {
        thisNode.beforeValueWhitespace = new MwWhiteSpace(' ');
      }

      if (!isLastNode && prevNode instanceof MwParamNode) {
        if (thisNode instanceof MwWhiteSpace) {
          thisNode.content = '\n';
        } else {
          let newWhiteSpace = new MwWhiteSpace('\n');
          newAllNodes.push(newWhiteSpace);
          this.handle.insertNodes(this.handle.indexOf(thisNode) + 1, [newWhiteSpace]);
        }
      }

      if (isLastNode) {
        let lastNodeText;
        if (this.handle.isCombat) {
          if (isLastItemOfLastGroup) {
            lastNodeText = '\n';
          } else {
            lastNodeText = isLastItemOfGroup ? '\n\n' : '\n';
          }
        } else {
          lastNodeText = isLastItemOfLastGroup ? '\n' : '\n\n';
        }

        if (thisNode instanceof MwWhiteSpace) {
          thisNode.content = lastNodeText;
        } else {
          let newWhiteSpace = new MwWhiteSpace(lastNodeText);
          newAllNodes.push(newWhiteSpace);
          this.handle.insertNodes(this.handle.indexOf(thisNode) + 1, [newWhiteSpace]);
        }
      }
    }

    if (newAllNodes.length > this.allNodes.length) {
      this.allNodes = newAllNodes;
    }

    this.processKeyChange();
  }

  get paramNodes(): MwParamNode[] {
    return this.allNodes.filter(node => node instanceof MwParamNode) as MwParamNode[];
  }

  get firstNodeIndex() {
    if (this.isEmpty()) {
      return this.group.firstNodeIndex;
    }
    return Math.min(... this.allNodes.map(node => this.handle.templateNode.parts.indexOf(node)));
  }

  get lastNodeIndex() {
    if (this.isEmpty()) {
      return this.group.lastNodeIndex;
    }
    return Math.max(... this.allNodes.map(node => this.handle.templateNode.parts.indexOf(node)));
  }

  private processKeyChange() {
    for (let param of this.paramNodes) {
      let keyParts = this.handle.parseKey(param.key);
      let didChange: boolean = false;

      if (keyParts.groupKey !== this.group.groupKey) {
        keyParts.groupKey = this.group.groupKey;
        didChange = true;
      }

      if (keyParts.itemKey !== this.itemKey) {
        keyParts.itemKey = this.itemKey;
        didChange = true;
      }

      if (didChange) {
        param.key = (this.handle.compileKey(keyParts) + ' ').padEnd(this.handle.keyPadLen, ' ');
      }
    }
  }
}

export class VoGroupTitle {
  // Parent ref:
  readonly handle: VoHandle;
  readonly group: VoGroup;

  // Self info:
  readonly uuid: string;
  titleNode: MwComment = null;
  allNodes: MwNode[] = [];

  constructor(handle: VoHandle, voGroup: VoGroup) {
    this.uuid = handle.setUUID(this);
    this.handle = handle;
    this.group = voGroup;
  }

  isEmpty(): boolean {
    return !this.allNodes.length;
  }

  recalculate() {
    if (!this.handle.compileDone || !this.titleNode) {
      return;
    }
    let lastNode = this.allNodes[this.allNodes.length - 1];
    if (lastNode instanceof MwWhiteSpace) {
      lastNode.content = '\n';
    } else {
      let newWhitespace = new MwWhiteSpace('\n');
      this.allNodes.push(newWhitespace);
      this.handle.insertNodes(this.handle.indexOf(lastNode) + 1, [newWhitespace]);
    }
  }

  get text() {
    return this.titleNode ? this.titleNode.content.trim() : '';
  }

  set text(newTitle: string) {
    if (!this.titleNode) {
      this.titleNode = new MwComment('<!--', ' '+newTitle+' ', '-->');
      let newNodes = [
        this.titleNode,
        new MwWhiteSpace('\n'),
      ];
      if (this.group.isEmpty()) {
        this.handle.insertNodes(this.group.lastNodeIndex + 1, newNodes);
      } else {
        this.handle.insertNodes(this.group.firstNodeIndex, newNodes);
      }
      this.allNodes = newNodes;
    } else {
      this.titleNode.content = ' '+newTitle+' ';
    }
  }

  get firstNodeIndex(): number {
    if (this.isEmpty()) {
      return this.group.firstNodeIndex;
    }
    return Math.min(... this.allNodes.map(node => this.handle.templateNode.parts.indexOf(node)));
  }

  get lastNodeIndex(): number {
    if (this.isEmpty()) {
      return this.group.lastNodeIndex;
    }
    return Math.max(... this.allNodes.map(node => this.handle.templateNode.parts.indexOf(node)));
  }
}

export class VoGroup {
  // Parent ref:
  readonly handle: VoHandle;

  // Self info:
  readonly uuid: string;
  private _groupKey: string = null;
  readonly title: VoGroupTitle;
  readonly items: VoItem[];

  constructor(handle: VoHandle) {
    this.uuid = handle.setUUID(this);
    this.handle = handle;
    this.title = new VoGroupTitle(this.handle, this);
    this.items = [];
  }

  isEmpty(): boolean {
    let itemsEmpty = !this.items.length || this.items.every(item => item.isEmpty());
    let titleEmpty = this.title.isEmpty();
    return itemsEmpty && titleEmpty;
  }

  recalculate() {
    if (!this.handle.compileDone) {
      return;
    }
    let groupNum = this.position + 1;
    if (isInt(this.groupKey)) {
      this.groupKey = String(groupNum).padStart(2, '0');
    }

    this.title.recalculate();

    for (let item of this.items) {
      item.recalculate();
    }
  }

  get htmlId(): string {
    return (this.handle.isCombat ? 'combat_' : 'story_') + this._groupKey;
  }

  get groupKey(): string {
    return this._groupKey;
  }

  set groupKey(newGroupKey: string) {
    this._groupKey = newGroupKey;
    this.items.forEach(item => item.recalculate());
  }

  get allNodes(): MwNode[] {
    let nodes = [];
    nodes.push(... this.title.allNodes);
    for (let item of this.items) {
      nodes.push(... item.allNodes);
    }
    return nodes;
  }

  get position(): number {
    return this.handle.groups.indexOf(this);
  }

  remove(): boolean {
    if (this.position < 0) {
      return false;
    }
    let allNodes = this.allNodes;
    for (let node of allNodes) {
      this.handle.removeNode(node);
    }
    arrayRemove(this.handle.groups, [this]);
    this.handle.recalculate();
    return true;
  }

  moveTo(newPosition: number): boolean {
    if (newPosition === this.position) {
      return false;
    }

    if (newPosition < 0 || newPosition > this.handle.groups.length) {
      throw 'Invalid new group position: ' + newPosition;
    }

    let allNodes = this.allNodes;
    this.remove();

    let insertNodeIndex = this.insertIndexForGroupPosition(newPosition);

    this.handle.insertNodes(insertNodeIndex, allNodes);
    this.handle.groups.splice(newPosition, 0, this);
    this.handle.recalculate();
    return true;
  }

  private insertIndexForGroupPosition(position: number) {
    let isEndPos = position >= this.handle.groups.length;
    let group = this.handle.groups[constrainNumber(position, 0, this.handle.groups.length - 1)];
    return isEndPos ? group.lastNodeIndex + 1 : group.firstNodeIndex;
  }

  /**
   * Create or get VO item with `itemKey`.
   * @param itemKey
   */
  item(itemKey: string): VoItem {
    let item = this.items.find(item => item.itemKey === itemKey);
    if (!item) {
      item = new VoItem(this.handle, this);
      item.itemKey = itemKey;
      this.items.push(item);
      this.handle.recalculate();
    }
    return item;
  }

  newItem(): VoItem {
    let newItemKey = String(this.items.length + 1);
    return this.item(this.handle.isCombat ? newItemKey : newItemKey.padStart(2, '0'));
  }

  get firstNodeIndex(): number {
    if (this.isEmpty()) {
      return this.handle.firstNodeIndex;
    }
    let indices: number[] = [];
    if (!this.title.isEmpty()) {
      indices.push(this.title.firstNodeIndex);
    }
    for (let item of this.items) {
      if (!item.isEmpty()) {
        indices.push(item.firstNodeIndex);
      }
    }
    return Math.min(... indices);
  }

  get lastNodeIndex(): number {
    if (this.isEmpty()) {
      return this.handle.lastNodeIndex;
    }
    let indices: number[] = [];
    if (!this.title.isEmpty()) {
      indices.push(this.title.lastNodeIndex);
    }
    for (let item of this.items) {
      if (!item.isEmpty()) {
        indices.push(item.lastNodeIndex);
      }
    }
    return Math.max(... indices);
  }
}

export class VoHandle {
  readonly templateNode: MwTemplateNode;
  readonly groups: VoGroup[] = [];
  private uuidMap: {[uuid: string]: any} = {};
  isCombat: boolean = false;
  compileDone: boolean = false;
  keyPadLen: number = 20;

  constructor(templateNode: MwTemplateNode) {
    this.templateNode = templateNode;
  }

  clear() {
    this.uuidMap = {};
    this.compileDone = false;
    while (this.groups.length) {
      this.groups.pop();
    }
  }

  byUUID<T>(uuid: string): T {
    return this.uuidMap[uuid];
  }

  setUUID(o: any): string {
    let uuid = uuidv4();
    this.uuidMap[uuid] = o;
    return uuid;
  }

  isEmpty(): boolean {
    return !this.groups.length || this.groups.every(g => g.isEmpty());
  }

  get firstNodeIndex(): number {
    if (!this.groups.length) {
      return 0;
    }
    return this.groups[0].firstNodeIndex;
  }

  get lastNodeIndex(): number {
    if (!this.groups.length) {
      return 0;
    }
    let nonEmptyGroups = this.groups.filter(g => !g.isEmpty());
    return nonEmptyGroups[nonEmptyGroups.length - 1].lastNodeIndex;
  }

  recalculate() {
    if (!this.compileDone) {
      return;
    }
    let noSort = this.groups.find(g => g.isEmpty());
    if (!noSort) {
      sort(this.groups, 'firstNodeIndex');
    }
    for (let group of this.groups) {
      group.recalculate();
    }
  }

  parseKey(paramKey: string|number): VoParamKey {
    if (typeof paramKey === 'number') {
      return {groupKey: undefined, itemKey: undefined, prop: undefined}; // anonymous parameter
    }
    if (paramKey.startsWith('vo_')) {
      const keyParts = splitLimit(paramKey, '_', 4);
      const groupKey = keyParts[1];
      const itemKey = keyParts[2];
      const prop = keyParts[3];
      return {groupKey, itemKey, prop};
    }
    if (this.isCombat) {
      const keyParts = splitLimit(paramKey, '_', 3);
      const groupKey = keyParts[0];
      const itemKey = keyParts[1];
      const prop = keyParts[2];
      return {groupKey, itemKey, prop};
    }
    return {groupKey: undefined, itemKey: undefined, prop: paramKey};
  }

  compileKey(paramKey: VoParamKey) {
    if (this.isCombat) {
      return `${paramKey.groupKey}_${paramKey.itemKey}_${paramKey.prop}`
    } else {
      return `vo_${paramKey.groupKey}_${paramKey.itemKey}_${paramKey.prop}`
    }
  }

  indexOf(node: number|MwNode): number {
    let index;
    if (node instanceof MwNode) {
      index = this.templateNode.parts.indexOf(node);
    } else {
      index = node;
    }
    if (index > this.templateNode.parts.length - 1) {
      return -1;
    }
    return index;
  }

  insertNodes(index: number, newItems: MwNode[]) {
    this.templateNode.parts.splice(index, 0, ... newItems);
  }

  removeNodes(nodes: (number|MwNode)[]): boolean {
    return nodes.map(node => this.removeNode(node)).some(res => !!res);
  }

  removeNode(node: number|MwNode): boolean {
    let index = this.indexOf(node);
    if (index > -1) {
      this.templateNode.parts.splice(index, 1);
      return true;
    }
    return false;
  }

  replaceNode(node: number|MwNode, newNode: MwNode): boolean {
    let index = this.indexOf(node);
    if (index > -1) {
      this.templateNode.parts[index] = newNode;
      return true;
    }
    return false;
  }

  /**
   * Create or get group with `groupKey`.
   * @param groupKey
   */
  group(groupKey: string): VoGroup {
    let group = this.groups.find(group => group.groupKey === groupKey);
    if (!group) {
      group = new VoGroup(this);
      group.groupKey = groupKey;
      this.groups.push(group);
      this.recalculate();
    }
    return group;
  }

  newGroup(): VoGroup {
    return this.group(String(this.groups.length + 1).padStart(2, '0'));
  }

  compile(): VoHandle {
    this.clear();
    this.compileDone = false;

    let seenParamKeys: Set<string> = new Set();
    let seenTitleSubseqNodes: Set<MwNode> = new Set();
    let currentGroup: VoGroup = null;
    let currentItem: VoItem = null;
    this.isCombat = this.templateNode.templateName.toLowerCase().includes('combat');

    for (let node of this.templateNode.parts) {
      if (node instanceof MwParamNode && typeof node.key === 'string') {
        const key = node.key;

        if (seenParamKeys.has(key)) {
          throw 'Template contains duplicates of parameter: ' + key;
        }
        seenParamKeys.add(key);

        const {groupKey, itemKey, prop} = this.parseKey(key);

        if (groupKey && itemKey && prop) {
          const group = this.group(groupKey);
          const item = group.item(itemKey);

          item.propToParam[prop] = node;

          currentGroup = group;
          currentItem = item;
          currentItem.allNodes.push(node);
        }

        let keyLen = arraySum(node.keyParts.map(part => part.content.length));
        if (keyLen > this.keyPadLen) {
          this.keyPadLen = keyLen;
        }
      } else if (node instanceof MwParamNode && typeof node.key === 'number') {
        if (node.key === 0) {
          continue;
        }
        throw 'Unexpected anonymous parameter ' + node.key + ' with value: ' + node.value;
      } else if (node instanceof MwComment) {
        let commentIdx = this.templateNode.parts.indexOf(node);
        let prevParam: MwParamNode;
        let nextParam: MwParamNode;
        let subseqNodes: MwNode[] = []; // subsequent nodes between the comment node and the next param node

        for (let i = commentIdx + 1; i < this.templateNode.parts.length; i++) {
          let nextNode = this.templateNode.parts[i];
          if (nextNode instanceof MwParamNode) {
            nextParam = nextNode;
            break;
          } else {
            subseqNodes.push(nextNode);
          }
        }
        for (let i = commentIdx - 1; i >= 0; i--) {
          let prevNode = this.templateNode.parts[i];
          if (prevNode instanceof MwParamNode) {
            prevParam = prevNode;
            break;
          }
        }

        let isGroupTitleComment = false; // the if statements below will check if the comment is a group title, storing the result in this variable
        let groupKey: string = null; // if the comment is for a group title, then this variable would hold the group key

        if (!nextParam) {
          // If there's no next param, then do not consider it to be a group title
          // and keep it in the current item (if there is one)
        } else if (!prevParam) {
          let keyParts = this.parseKey(nextParam.key);
          // If no prev param, then consider it to be a group title if only the nextParam is a VO param
          if (isset(keyParts.groupKey) && isset(keyParts.itemKey)) {
            isGroupTitleComment = true;
            groupKey = keyParts.groupKey;
          }
        } else {
          let prevKeyParts = this.parseKey(prevParam.key);
          let nextKeyParts = this.parseKey(nextParam.key);
          // If both prev and next param, then consider it to be a group title only if the nextParam is a VO param
          // and is not in the same group as prevParam
          if (isset(nextKeyParts.groupKey) && isset(nextKeyParts.itemKey) && nextKeyParts.groupKey !== prevKeyParts.groupKey) {
            isGroupTitleComment = true;
            groupKey = nextKeyParts.groupKey;
          }
        }

        if (!isGroupTitleComment && currentItem) {
          // If not a group title, and there is a current item, then keep the comment in the current item...
          currentItem.allNodes.push(node);
        }

        if (isGroupTitleComment) {
          let titleObj: VoGroupTitle = this.group(groupKey).title;
          titleObj.titleNode = node;
          titleObj.allNodes.push(node, ... subseqNodes);
          subseqNodes.forEach(subseqNode => seenTitleSubseqNodes.add(subseqNode))
        }
      } else {
        if (currentItem && !seenTitleSubseqNodes.has(node)) {
          currentItem.allNodes.push(node);
        }
      }
    }
    this.compileDone = true;
    return this;
  }
}

export function createVoHandle(templateNode: MwTemplateNode|string): VoHandle {
  if (isStringBlank(templateNode)) {
    return null;
  }
  if (typeof templateNode === 'string') {
    templateNode = mwParse(templateNode).findTemplateNodes().find(p => p.templateName.includes('VO'));
  }
  return templateNode ? new VoHandle(templateNode) : null;
}

export function createVoHandles(templateNodes: MwTemplateNode[]|string): VoHandle[] {
  if (isStringBlank(templateNodes)) {
    return [];
  }
  if (typeof templateNodes === 'string') {
    templateNodes = mwParse(templateNodes).findTemplateNodes().filter(p => p.templateName.includes('VO'));
  }
  return templateNodes.map(templateNode => new VoHandle(templateNode));
}