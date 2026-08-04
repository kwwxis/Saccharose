// noinspection JSUnusedGlobalSymbols

import { Component } from '@vue/runtime-core';
import { App, Slots } from 'vue';

export function isVueComponent(object: any): object is Component {
  return !!(<any> object).ssrRender || !!(<any> object).render;
}

export function isVueApp(object: any): object is App {
  return !!(<any> object)._component && !!(<any> object)._context && !!(<any> object).version;
}

export type VuePropsOf<T> = T extends new (...args: any[]) => { $props: infer P } ? P : never;

// Unified slot type extraction
export type VueSlotsOf<C extends Component> =
  // Composition API (script setup with defineSlots)
  C extends { __slots?: infer S }
    ? NonNullable<S>
  // Options API (defineComponent with SlotsType)
  : C extends new (...args: any[]) => { $slots: infer S }
    ? NonNullable<S>
  // Check for slots in the component type
  : C extends { slots?: infer S }
    ? S extends Record<string, any>
      ? S
      : Slots
  // Fallback to generic Slots
  : Slots;
