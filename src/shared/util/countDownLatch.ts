import { uuidv4 } from './uuidv4.ts';
import AsyncLock from 'async-lock';

const lock = new AsyncLock();

export class CountDownLatch implements PromiseLike<void> {
  private promise: Promise<void>;
  private resolve: (value: (PromiseLike<void> | void)) => void;
  private uuid: string;

  constructor(private count: number) {
    this.uuid = uuidv4();
    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  public async countdown() {
    await lock.acquire(this.uuid, () => {
      if (this.count === 0) {
        return;
      }
      this.count--;
      if (this.count === 0) {
        this.resolve();
      }
    });
  }

  async await(): Promise<void> {
    await this.promise;
  }

  then<TResult1 = void, TResult2 = never>(onfulfilled?: ((value: void) => (PromiseLike<TResult1> | TResult1)) | undefined | null, onrejected?: ((reason: any) => (PromiseLike<TResult2> | TResult2)) | undefined | null): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}
