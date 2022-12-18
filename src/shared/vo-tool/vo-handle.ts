// noinspection JSUnusedGlobalSymbols

import { MwComment, MwNode, MwParamNode, MwTemplateNode, MwWhiteSpace } from '../mediawiki/mwTypes';
import { mwParse } from '../mediawiki/mwParse';
import { splitLimit } from '../util/stringUtil';
import { arraySum } from '../util/arrayUtil';
import { isset } from '../util/genericUtil';

export class VoItem {
  // Parent ref:
  handle: VoHandle;
  group: VoGroup;

  // Self info:
  itemKey: string = null;
  propToParam: {[propName: string]: MwParamNode} = {};
  allNodes: MwNode[] = [];

  constructor(handle: VoHandle, voGroup: VoGroup) {
    this.handle = handle;
    this.group = voGroup;
  }

  get paramNodes(): MwParamNode[] {
    return Object.values(this.propToParam);
  }

  get firstParamIndex() {
    return Math.min(... this.paramNodes.map(node => this.handle.templateNode.parts.indexOf(node)));
  }

  get lastParamIndex() {
    return Math.max(... this.allNodes.map(node => this.handle.templateNode.parts.indexOf(node)));
  }

  get firstNodeIndex() {
    return Math.min(... this.allNodes.map(node => this.handle.templateNode.parts.indexOf(node)));
  }

  get lastNodeIndex() {
    return Math.max(... this.allNodes.map(node => this.handle.templateNode.parts.indexOf(node)));
  }
}

export class VoGroupTitle {
  // Parent ref:
  handle: VoHandle;
  group: VoGroup;

  // Self info:
  titleNode: MwComment = null;
  allNodes: MwNode[] = [];

  constructor(handle: VoHandle, voGroup: VoGroup) {
    this.handle = handle;
    this.group = voGroup;
  }

  get text() {
    return this.titleNode && this.titleNode.content.trim();
  }

  set text(newTitle: string) {
    if (!this.titleNode) {
      this.titleNode = new MwComment('<!--', ' '+newTitle+' ', '-->');
      this.allNodes = [
        this.titleNode,
        new MwWhiteSpace('\n'),
      ];
      this.handle.insertNodes(this.group.firstNodeIndex, this.allNodes);
    } else {
      this.titleNode.content = ' '+newTitle+' ';
    }
  }

  get firstNodeIndex(): number {
    return Math.min(... this.allNodes.map(node => this.handle.templateNode.parts.indexOf(node)));
  }

  get lastNodeIndex(): number {
    return Math.max(... this.allNodes.map(node => this.handle.templateNode.parts.indexOf(node)));
  }
}

export class VoGroup {
  // Parent ref:
  handle: VoHandle;

  // Self info:
  groupKey: string = null;
  title: VoGroupTitle;
  items: VoItem[];

  constructor(handle: VoHandle) {
    this.handle = handle;
    this.title = new VoGroupTitle(this.handle, this);
    this.items = [];
  }

  item(num: string) {
    let item = this.items.find(item => item.itemKey === num);
    if (!item) {
      item = new VoItem(this.handle, this);
      item.itemKey = num;
      this.items.push(item);
    }
    return item;
  }

  get keyPadLen() {
    let len = 0;
    for (let item of this.items) {
      for (let node of item.paramNodes) {
        let nodeLen = arraySum(node.keyParts.map(part => part.content.length));
        if (nodeLen > len) {
          len = nodeLen;
        }
      }
    }
    return len;
  }

  get firstNodeIndex(): number {
    return Math.min(this.title.firstNodeIndex, ... this.items.map(item => item.firstNodeIndex));
  }

  get lastNodeIndex(): number {
    return Math.max(this.title.lastNodeIndex, ... this.items.map(item => item.lastNodeIndex));
  }
}

export class VoHandle {
  templateNode: MwTemplateNode;
  groups: VoGroup[] = [];

  constructor(templateNode: MwTemplateNode) {
    this.templateNode = templateNode;
  }

  insertNodes(index: number, ...newItems: MwNode[]) {
    this.templateNode.parts = [
      ... this.templateNode.parts.slice(0, index),
      ... newItems,
      ... this.templateNode.parts.slice(index),
    ];
  }

  removeNode(node: number|MwNode) {
    let index: number;
    if (node instanceof MwNode) {
      index = this.templateNode.parts.indexOf(node);
    } else {
      index = node;
    }
    if (index > -1) {
      this.templateNode.parts.splice(index, 1);
    }
  }

  group(groupKey: string) {
    let group = this.groups.find(group => group.groupKey === groupKey);
    if (!group) {
      group = new VoGroup(this);
      group.groupKey = groupKey;
      this.groups.push(group);
    }
    return group;
  }

  compile(): VoHandle {
    let seenParamKeys: Set<string> = new Set();
    let currentGroup: VoGroup = null;
    let currentItem: VoItem = null;
    let isCombat: boolean = this.templateNode.templateName.toLowerCase().includes('combat');

    const parseKey = (paramKey: string|number): {groupKey: string, itemKey: string, prop: string} => {
      if (typeof paramKey === 'number') {
        return {groupKey: undefined, itemKey: undefined, prop: undefined};
      }
      if (paramKey.startsWith('vo_')) {
        const keyParts = splitLimit(paramKey, '_', 4);
        const groupKey = keyParts[1];
        const itemKey = keyParts[2];
        const prop = keyParts[3];
        return {groupKey, itemKey, prop};
      }
      if (isCombat) {
        const keyParts = splitLimit(paramKey, '_', 3);
        const groupKey = keyParts[0];
        const itemKey = keyParts[1];
        const prop = keyParts[2];
        return {groupKey, itemKey, prop};
      }
      return {groupKey: undefined, itemKey: undefined, prop: paramKey};
    };

    for (let node of this.templateNode.parts) {
      if (node instanceof MwParamNode && typeof node.key === 'string') {
        const key = node.key;

        if (seenParamKeys.has(key)) {
          throw 'Template contains duplicates of parameter: ' + key;
        }
        seenParamKeys.add(key);

        const {groupKey, itemKey, prop} = parseKey(key);

        if (key.startsWith('vo_')) {
          const group = this.group(groupKey);
          const item = group.item(itemKey);

          item.propToParam[prop] = node;

          currentGroup = group;
          currentItem = item;
          currentItem.allNodes.push(node);
        }
      } else if (node instanceof MwParamNode && typeof node.key === 'number') {
        if (node.key === 0) {
          continue;
        }
        throw 'Unexpected anonymous parameter ' + node.key + ' :' + node.value;
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
          let keyParts = parseKey(nextParam.key);
          // If no prev param, then consider it to be a group title if only the nextParam is a VO param
          if (isset(keyParts.groupKey) && isset(keyParts.itemKey)) {
            isGroupTitleComment = true;
            groupKey = keyParts.groupKey;
          }
        } else {
          let prevKeyParts = parseKey(prevParam.key);
          let nextKeyParts = parseKey(nextParam.key);
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
        }
      } else {
        if (currentItem) {
          currentItem.allNodes.push(node);
        }
      }
    }
    return this;
  }
}

export function createVoHandle(templateNode: MwTemplateNode|string): VoHandle {
  if (typeof templateNode === 'string') {
    templateNode = mwParse(templateNode.replace(/\r/g, ''))
      .parts.find(p => p instanceof MwTemplateNode && p.templateName.includes('VO')) as MwTemplateNode;
  }
  return new VoHandle(templateNode);
}