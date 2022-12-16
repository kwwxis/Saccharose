import { MwComment, MwParamNode, MwTemplateNode } from '../mediawiki/mwTypes';

export class VoSection {
  titleCommentNode: MwComment;
  params: MwParamNode[];

}

export class VoHandle {
  templateNode: MwTemplateNode;

  constructor(templateNode: MwTemplateNode) {
    this.templateNode = templateNode;
  }

  get sections() {
    let section = {};
    return [];
  }

  moveSection(sectNum: number) {

  }
}

export function createVoHandle(template: MwTemplateNode) {

}