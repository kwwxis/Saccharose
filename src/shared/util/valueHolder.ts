import AsyncLock from 'async-lock';

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
}

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
