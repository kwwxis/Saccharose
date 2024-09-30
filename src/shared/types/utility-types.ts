export type Subset<K, T extends K> = T;

export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;

export type ExtractScalar<A> = A extends readonly (infer T)[] ? T : A;

export type NonArray = (object | string | bigint | number | boolean) & { length?: never; };

export type KeysMatching<T, V> = {[K in keyof T]-?: T[K] extends V ? K : never}[keyof T];

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>>
  & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys];

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>>
  & {
    [K in Keys]-?:
      Required<Pick<T, K>>
      & Partial<Record<Exclude<Keys, K>, undefined>>
  }[Keys]

export type FileAndSize = {name: string, size: number};
