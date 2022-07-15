import AsyncLock from 'async-lock';

/**
 * @param {Set<string>} set
 * @param {String[]} search
 * @returns {boolean}
 */
function setContainsAll(set: Set<string>, search: string[]): boolean {
  if (!search || !search.length) return true;
  return search.every(x => set.has(x));
}

export interface PromiseQueueItem {
  name: string;
  promiseSupplier(): Promise<any>|Function;
  locks?: string[];
  executed?: boolean;
}

export default class PromiseQueue {
  queue: PromiseQueueItem[];
  lock: AsyncLock;
  fulfilled: Set<string>;

  constructor() {
    /**
     * @type {PromiseQueueItem[]}
     */
    this.queue = [];
    this.fulfilled = new Set<string>();
    this.lock = new AsyncLock();
  }

  /**
   * @param {PromiseQueueItem} item
   * @param {boolean} [execImmediate=true]
   */
  async add(item: PromiseQueueItem, execImmediate: boolean = true) {
    return await this.lock.acquire('enqueue', async () => {
      this.queue.push(item);

      if (execImmediate) {
        return await this.execute();
      }
    });
  }

  /**
   * @param {PromiseQueueItem[]} items
   * @param {boolean} [execImmediate=true]
   */
  async addMultiple(items: PromiseQueueItem[], execImmediate: boolean = true) {
    return await this.lock.acquire('enqueue', async () => {
      items.forEach(item => this.queue.push(item));

      if (execImmediate) {
        return await this.execute();
      }
    });
  }

  async execute(): Promise<{[promiseName: string]: any}> {
    let newQueue = [];
    let results = {};
    let didExecAny = false;

    await Promise.all(
      this.queue.map(async item => {
        let {name, promiseSupplier, locks} = item;

        if (setContainsAll(this.fulfilled, locks) && promiseSupplier && !item.executed) {
          item.executed = true;

          let p: Promise<any>;
          let x = promiseSupplier();

          if (typeof x === 'function') {
            if (x.constructor.name === 'AsyncFunction') {
              p = Promise.resolve(await x());
            } else {
              p = Promise.resolve(x());
            }
          } else if (typeof x === 'object' && typeof x.finally === 'function') {
            p = x;
          } else {
            throw new Error('PromiseQueue: a promise supplier returned something other than a promise');
          }

          p.finally(() => {
            this.fulfilled.add(name);
            didExecAny = true;
          });

          results[name] = await p;
        } else {
          newQueue.push(item);
        }
      })
    );

    if (didExecAny) {
      await this.execute();
    }

    return results;
  }
};