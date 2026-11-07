import { Request, Response } from 'express';
import { Component } from '@vue/runtime-core';
import { ITrace, TraceKey } from '../middleware/request/tracer.ts';
import { VirtualComponent } from './virtualComponent.ts';
import AppLayout from '../components/site/layouts/AppLayout.vue';
import { SiteUserProvider } from '../middleware/auth/SiteUserProvider.ts';
import VisitorWrapper from '../components/site/layouts/VisitorWrapper.vue';
import { App, createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { renderBaseLayoutTemplate } from './baseLayoutTemplate.ts';

export async function doRender(req: Request,
                               res: Response,
                               component: Component,
                               trace: ITrace,
                               props?: any): Promise<string | Error> {
  // Capture the call stack synchronously, right as this render is kicked off. Errors thrown deep inside Vue's
  // SSR internals (e.g. via ssrRenderList/ssrRenderSlot) typically lose the outer async call stack by the time
  // they're caught below, making it impossible to tell which route/controller triggered the render. We stitch
  // this captured stack onto any such error, so the originating request/controller is still visible in logs.
  const componentName: string = (component as any)?.__name || (component as any)?.name || 'UnknownComponent';
  const renderCallSite = new Error(`doRender(${componentName}) called for: ${req.method} ${req.originalUrl || req.url}`);
  try {
    if (!req.context) {
      throw new Error('Request context is not initialized. Make sure to use reqContextInitMiddleware before calling doRender.');
    }
    req.context.update(props);

    let rootComponent: VirtualComponent = VirtualComponent.empty();
    let rootPointer: VirtualComponent = rootComponent;

    switch (req.context.layoutType) {
      case 'basic':
        rootComponent.set(AppLayout, {
          isBasic: true,
        });
        break;
      case 'app':
        rootComponent.set(AppLayout, {
          isBasic: false,
          siteNoticeBanners: await SiteUserProvider.getSiteNoticesForBanner(req),
        });
        break;
      case 'empty':
        break;
      case 'visitor':
        rootComponent.set(AppLayout, {
          isBasic: true,
        });
        const visitorWrapper = VirtualComponent.of(VisitorWrapper);
        rootComponent.default(visitorWrapper);
        rootPointer = visitorWrapper;
        break;
    }

    if (req.context.layoutType !== 'empty') {
      rootPointer.default(VirtualComponent.of(component, props));
    } else {
      rootComponent.set(component, props);
    }

    const ssrApp: App = createSSRApp(rootComponent.compile())
      .mixin({ inheritAttrs: false })
      .provide(TraceKey, trace);

    let rendered = await renderToString(ssrApp);

    if (req.context.layoutType !== 'empty') {
      let csrfToken = typeof req.csrfToken === 'function' ? req.csrfToken() : '';
      rendered = renderBaseLayoutTemplate(req, rendered, rootComponent.gatherNames(), csrfToken);
    }

    res.set('Content-Type', 'text/html');
    res.send(rendered);

    return rendered;
  } catch (e: unknown) {
    if (e instanceof Error && e.stack && renderCallSite.stack) {
      // Append the captured call-site stack (skipping its own "Error: ..." message line) so the log shows both
      // where the error actually occurred (e.g. deep in Vue SSR internals) and which route/controller/request
      // triggered the render in the first place.
      e.stack += '\n    --- Render triggered from ---\n' + renderCallSite.stack.split('\n').slice(1).join('\n');
    }
    if (props && props.throwOnError) {
      throw e;
    } else if (req.next) {
      req.next(e);
    }
    if (e instanceof Error) {
      return e;
    }
  }
}
