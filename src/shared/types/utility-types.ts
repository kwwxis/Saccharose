export type Subset<K, T extends K> = T;

export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;

export type ExtractScalar<A> = A extends readonly (infer T)[] ? T : A;

export type NonArray = (object | string | bigint | number | boolean) & { length?: never; };

export type KeysMatching<T, V> = {[K in keyof T]-?: T[K] extends V ? K : never}[keyof T];

//export type KeysMatching<T,V> = keyof { [ P in keyof T as T[P] extends V ? P : never ] : P } & keyof T;