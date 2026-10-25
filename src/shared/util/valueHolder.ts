// noinspection JSUnusedGlobalSymbols

import AsyncLock from 'async-lock';

/**
 * A basic holder for a value of type T. It provides methods to get and set the value.
 *
 * This does not provide any thread-safety guarantees. If you need thread-safe operations, consider using AtomicReference or AtomicInt.
 */
export class ValueHolder<T> {
  protected value: T;

  constructor(initialValue?: T) {
    if (typeof initialValue !== 'undefined')
      this.value = initialValue;
    else
      this.value = undefined;
  }

  get(): T {
    return this.value;
  }

  set(newValue: T): void {
    this.value = newValue;
  }
}

/**
 * A holder for an integer value. It extends ValueHolder<number> and provides additional methods for incrementing and decrementing the value.
 *
 * This does not provide any thread-safety guarantees. If you need thread-safe operations, consider using AtomicInt.
 */
export class IntHolder extends ValueHolder<number> {
  constructor(initialValue: number = 0) {
    super(initialValue);
  }

  increment(): void {
    this.value++;
  }

  decrement(): void {
    this.value--;
  }

  getAndIncrement(): number {
    return this.value++;
  }

  incrementAndGet(): number {
    return ++this.value;
  }

  getAndDecrement(): number {
    return this.value--;
  }

  decrementAndGet(): number {
    return --this.value;
  }
}

/**
 * A "thread-safe" holder for a value of type T.
 *
 * It provides methods to get and set the value.
 *
 * This class uses an AsyncLock to ensure that get and set operations happen in critical sections, preventing race conditions.
 *
 * Although JavaScript is single-threaded, that doesn't mean that you can't have race conditions as a result of
 * asynchronous code, in which multiple functions may be executing at the "same time" with interweaved execution
 * of their lines of code.
 */
export class AtomicReference<T> {
  protected myLock: AsyncLock;
  protected value: T;

  constructor(initialValue?: T) {
    if (typeof initialValue !== 'undefined')
      this.value = initialValue;
    else
      this.value = undefined;

    this.myLock = new AsyncLock();
  }

  async get(): Promise<T> {
    return this.myLock.acquire('value', () => {
      return this.value;
    });
  }

  async set(newValue: T): Promise<void> {
    await this.myLock.acquire('value', () => {
      this.value = newValue;
    });
  }

  async getAndSet(fn: (currentValue: T) => T): Promise<T> {
    return this.myLock.acquire('value', () => {
      const oldValue = this.value;
      this.value = fn(oldValue);
      return oldValue;
    });
  }
}

/**
 * A "thread-safe" holder for an integer value.
 *
 * It extends AtomicReference<number> and provides additional methods for incrementing and decrementing the value.
 *
 * This class uses an AsyncLock to ensure that all operations happen in critical sections, preventing race conditions.
 *
 * Although JavaScript is single-threaded, that doesn't mean that you can't have race conditions as a result of
 * asynchronous code, in which multiple functions may be executing at the "same time" with interweaved execution
 * of their lines of code.
 */
export class AtomicInt extends AtomicReference<number> {
  constructor(initialValue: number = 0) {
    super(initialValue);
  }

  async increment(): Promise<void> {
    await this.myLock.acquire('value', () => {
      this.value++;
    });
  }

  async decrement(): Promise<void> {
    await this.myLock.acquire('value', () => {
      this.value--;
    });
  }

  async getAndIncrement(): Promise<number> {
    return this.myLock.acquire('value', () => {
      return this.value++;
    });
  }

  async incrementAndGet(): Promise<number> {
    return this.myLock.acquire('value', () => {
      return ++this.value;
    });
  }

  async getAndDecrement(): Promise<number> {
    return this.myLock.acquire('value', () => {
      return this.value--;
    });
  }

  async decrementAndGet(): Promise<number> {
    return this.myLock.acquire('value', () => {
      return --this.value;
    });
  }
}
