// noinspection JSUnusedGlobalSymbols
export class DOMClassWatcher {
  private readonly targetNode: HTMLElement;
  private readonly classToWatch: string;
  private readonly classAddedCallback: () => void;
  private readonly classRemovedCallback: () => void;
  private observer: MutationObserver;
  private lastClassState: boolean;

  constructor(targetNode: HTMLElement|string, classToWatch: string, classAddedCallback: () => void, classRemovedCallback: () => void) {
    if (typeof targetNode === 'string') {
      this.targetNode = document.querySelector<HTMLElement>(targetNode);
    } else {
      this.targetNode = targetNode;
    }
    this.classToWatch = classToWatch;
    this.classAddedCallback = classAddedCallback;
    this.classRemovedCallback = classRemovedCallback;
    this.observer = null;
    this.lastClassState = this.targetNode.classList.contains(this.classToWatch);

    this.init();
  }

  init() {
    this.observer = new MutationObserver(this.mutationCallback);
    this.observe();
  }

  observe() {
    this.observer.observe(this.targetNode, { attributes: true });
  }

  disconnect() {
    this.observer.disconnect();
  }

  mutationCallback = mutationsList => {
    for (let mutation of mutationsList) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        let currentClassState = mutation.target.classList.contains(this.classToWatch);
        if (this.lastClassState !== currentClassState) {
          this.lastClassState = currentClassState;
          if (currentClassState) {
            this.classAddedCallback();
          } else {
            this.classRemovedCallback();
          }
        }
      }
    }
  };
}