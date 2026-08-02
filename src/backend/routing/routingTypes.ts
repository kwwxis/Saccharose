import { LayoutType, RequestContext, ThinRequest } from './requestContext.ts';
import { NextFunction, Request, Response } from 'express';
import { Component } from '@vue/runtime-core';

import { SiteUser } from '../../shared/types/site/site-user-types.ts';
import { App, Slots } from 'vue';

declare module 'express-serve-static-core' {
  interface Request {
    context: RequestContext,
    user: SiteUser,
  }
  interface Response {
    renderComponent<C extends Component>(view: C, options?: RequestCommonLocals & VuePropsOf<C>): Promise<string|Error>;
  }
  interface Router {
    endpoint(route: string | string[], handlers: RouterRestfulHandlers): void,
  }
}

export type RequestCommonLocals = {
  title?: string|((req: ThinRequest) => string),
  bodyClass?: string[]|((req: ThinRequest) => string[]),
  layoutType?: LayoutType|((req: ThinRequest) => LayoutType),
  throwOnError?: boolean,
}

export type RouterRestfulHandlers = {
  get?: (req: Request, res: Response, next: NextFunction) => void,
  post?: (req: Request, res: Response, next: NextFunction) => void,
  put?: (req: Request, res: Response, next: NextFunction) => void,
  delete?: (req: Request, res: Response, next: NextFunction) => void,
  error?: (err: any, req: Request, res: Response, next: NextFunction) => void,
};

export function isVueComponent(object: any): object is Component {
  return !!(<any> object).ssrRender || !!(<any> object).render;
}

export function isVueApp(object: any): object is App {
  return !!(<any> object)._component && !!(<any> object)._context && !!(<any> object).version;
}

export type VuePropsOf<T> = T extends new (...args: any[]) => { $props: infer P } ? P : never;

/*
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
*/
