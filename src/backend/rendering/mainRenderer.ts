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
