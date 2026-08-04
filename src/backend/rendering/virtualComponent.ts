import { Component, VNode, VNodeChild, h } from 'vue';
import { VuePropsOf } from './vueHelpers.ts';
import { removeSuffix } from '../../shared/util/stringUtil.ts';
import { basename } from 'path';

type VirtualSlotContent = VirtualComponent | VNodeChild;

/**
 * Abstraction over a Vue component that can be composed with typed props and named slots,
 * then compiled into a VNode tree via {@link VirtualComponent.compile}.
 *
 * Usage:
 * ```ts
 * const vnode = new VirtualComponent(OuterLayout, { title: 'Hello' })
 *   .slot('header', new VirtualComponent(PageHeader, { subtitle: 'World' }))
 *   .slot('default', 'Some plain text content')
 *   .compile();
 * ```
 */
export class VirtualComponent {
  private component: Component;
  private props: Record<string, any>;
  private slots: Map<string, VirtualSlotContent[]> = new Map();

  private constructor() {}

  public static empty(): VirtualComponent {
    return new VirtualComponent();
  }

  public static of<C extends Component>(component: C, props?: VuePropsOf<C>): VirtualComponent {
    const vc = new VirtualComponent();
    vc.set(component, props);
    return vc;
  }

  set<C extends Component>(component: C, props?: VuePropsOf<C>): this {
    this.component = component;
    this.props = (props ?? {}) as VuePropsOf<C>;
    return this;
  }

  /**
   * Returns the display name of the component, checking (in order):
   * 1. `component.name` — set by `defineComponent({ name: '...' })` or a named function component
   * 2. `component.__name` — injected by the Vue compiler for `<script setup>` SFCs
   * 3. `component.__file` — injected by the Vue compiler; the stem of the filename is used as a fallback
   */
  name(): string | undefined {
    const c = this.component as any;

    if (typeof c.name === 'string' && c.name)
      return c.name;

    if (typeof c.__name === 'string' && c.__name)
      return c.__name;

    if (typeof c.__file === 'string' && c.__file)
      return removeSuffix(basename(c.__file), '.vue') || undefined;

    return undefined;
  }

  /**
   * Append one or more items to the named slot. Chainable.
   * Each item may be another {@link VirtualComponent} (compiled recursively) or any raw {@link VNodeChild}.
   */
  slot(name: string, ...content: VirtualSlotContent[]): this {
    const existing = this.slots.get(name) ?? [];
    this.slots.set(name, [...existing, ...content]);
    return this;
  }

  /** Shorthand for {@link slot}('default', ...). */
  default(...content: VirtualSlotContent[]): this {
    return this.slot('default', ...content);
  }

  gatherNames(): string[] {
    const names = new Set<string>();

    let stack: VirtualComponent[] = [this];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;

      const name = current.name();
      if (name) {
        names.add(name);
      }
      for (let value of current.slots.values()) {
        for (let item of value) {
          if (item instanceof VirtualComponent) {
            stack.push(item);
          }
        }
      }
    }

    return Array.from(names);
  }

  /**
   * Recursively compile this component and all nested slot components into a VNode
   * using Vue's `h` function.
   */
  compile(): VNode {
    if (this.slots.size === 0) {
      return h(this.component, this.props);
    }

    const compiledSlots: Record<string, () => VNodeChild[]> = {};

    for (const [name, contents] of this.slots) {
      compiledSlots[name] = () => contents.map(item => {
        if (item instanceof VirtualComponent) {
          return item.compile();
        } else {
          return item;
        }
      }) as VNodeChild[];
    }

    return h(this.component, this.props as any, compiledSlots);
  }
}
