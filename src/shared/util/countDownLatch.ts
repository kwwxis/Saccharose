import { uuidv4 } from './uuidv4.ts';
import AsyncLock from 'async-lock';

const countDownLock = new AsyncLock();

/**
 * A CountDownLatch is a synchronization aid that allows one or more threads to wait until a set of operations being performed in other threads completes.
 *
 * The CountDownLatch is initialized with a given count. The await() method blocks until the count reaches zero, which can be achieved by calling countDown() the specified number of times.
 *
 * This implementation is designed to work in an asynchronous environment, allowing for non-blocking waits and safe concurrent access.
 *
 * This is based on the Java `CountDownLatch`, but adapted for use in JavaScript/TypeScript with Promises and async/await.
 * This class implements the PromiseLike interface, allowing it to be used directly with async/await syntax.
 */
export class CountDownLatch implements PromiseLike<void> {
  /**
   * Internal unique identifier for this CountDownLatch instance, used for locking to ensure thread-safe operations.
   * @private
   */
  private readonly uuid: string;
  /**
   * The underlying internal Promise that resolves when the count reaches zero.
   * This allows the await() method to be non-blocking and to return a Promise that can be awaited.
   * @private
   */
  private readonly promise: Promise<void>;
  /**
   * The resolve function for the internal Promise, which is called when the count reaches zero
   * to unblock any awaiting operations.
   * @private
   */
  private resolve: (value: (PromiseLike<void> | void)) => void;

  constructor(private count: number) {
    if (this.count < 0) {
      throw new Error('CountDownLatch count cannot be negative');
    }
    this.uuid = uuidv4();
    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  /**
   * Decrements the count of the latch, releasing all waiting threads if the count reaches zero.
   * If the count is already zero, this method has no effect.
   * This method is thread-safe and can be called from multiple threads concurrently.
   */
  public async countDown() {
    await countDownLock.acquire(this.uuid, () => {
      // If the count is already zero, we do nothing.
      // This prevents the count from going negative and ensures that the latch can only be released once.
      if (this.count === 0) {
        return;
      }

      // Decrement the count and check if it has reached zero.
      this.count--;
      if (this.count === 0) {
        this.resolve();
      }
    });
  }

  /**
   * Returns the current count of the latch.
   *
   * This method is thread-safe and can be called from multiple threads concurrently.
   * @return A promise that resolves to the current count of the latch.
   */
  public async getCount(): Promise<number> {
    return await countDownLock.acquire(this.uuid, () => {
      return this.count;
    });
  }

  /**
   * Method that can be used to await the completion of the latch.
   * It returns a Promise that resolves when the count reaches zero.
   *
   * This class can also be awaited directly, as it implements the PromiseLike interface.
   */
  async await(): Promise<void> {
    await this.promise;
  }

  then<TResult1 = void, TResult2 = never>(onfulfilled?: ((value: void) => (PromiseLike<TResult1> | TResult1)) | undefined | null, onrejected?: ((reason: any) => (PromiseLike<TResult2> | TResult2)) | undefined | null): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}
