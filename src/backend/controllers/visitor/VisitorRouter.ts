import { NextFunction, Request, Response, Router } from 'express';
import { create } from '../../routing/router.ts';
import { SiteUserProvider } from '../../middleware/auth/SiteUserProvider.ts';
import SitePrivacyPolicyPage from '../../components/site/SitePrivacyPolicyPage.vue';
import SiteTermsOfServicePage from '../../components/site/SiteTermsOfServicePage.vue';
import SiteContactPage from '../../components/site/SiteContactPage.vue';
import OLGenPage from '../../components/shared/OLGenPage.vue';
import OLCombinePage from '../../components/shared/OLCombinePage.vue';

export default async function(): Promise<Router> {
  const router: Router = create({
    locals: async (req: Request) => {
      if (req.isAuthenticated()) {
        return {
          siteNoticeBanners: await SiteUserProvider.getSiteNoticesForBanner(req.user?.id)
        };
      }
      return {};
    }
  });

  router.get('/privacy', async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || await SiteUserProvider.isBanned(req.user)) {
      return res.render(SitePrivacyPolicyPage, {
        title: 'Privacy Policy',
        layouts: ['layouts/basic-layout'],
        bodyClass: ['page--docs', 'page--privacy'],
      });
    } else {
      return res.render(SitePrivacyPolicyPage, {
        title: 'Privacy Policy',
        layouts: ['layouts/app-layout', 'layouts/app-layout-inner'],
        bodyClass: ['page--docs', 'page--privacy', 'page--larger'],
      });
    }
  });

  router.get('/terms', async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || await SiteUserProvider.isBanned(req.user)) {
      return res.render(SiteTermsOfServicePage, {
        title: 'Terms of Service',
        layouts: ['layouts/basic-layout'],
        bodyClass: ['page--docs', 'page--terms'],
      });
    } else {
      return res.render(SiteTermsOfServicePage, {
        title: 'Terms of Service',
        layouts: ['layouts/app-layout', 'layouts/app-layout-inner'],
        bodyClass: ['page--docs', 'page--terms', 'page--larger'],
      });
    }
  });

  router.get('/contact', async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || await SiteUserProvider.isBanned(req.user)) {
      return res.render(SiteContactPage, {
        title: 'Contact',
        layouts: ['layouts/basic-layout'],
        bodyClass: ['page--docs', 'page--contact'],
      });
    } else {
      return res.render(SiteContactPage, {
        title: 'Contact',
        layouts: ['layouts/app-layout', 'layouts/app-layout-inner'],
        bodyClass: ['page--docs', 'page--contact', 'page--larger'],
      });
    }
  });

  router.get('/genshin/OL', async (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.render(OLGenPage, {
      title: 'OL',
      layouts: ['layouts/basic-layout', 'layouts/visitor-wrapper'],
      bodyClass: ['page--OL']
    });
  });
  router.get(['/hsr/OL', '/zenless/OL', '/wuwa/OL'], async (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.render(OLGenPage, {
      title: 'OL',
      layouts: ['layouts/basic-layout', 'layouts/visitor-wrapper'],
      bodyClass: ['page--OL'],
      hideTlOption: true
    });
  });
  router.get(['/genshin/OL/combine', '/hsr/OL/combine', '/zenless/OL/combine', '/wuwa/OL/combine'], async (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.render(OLCombinePage, {
      title: 'OL Combine',
      layouts: ['layouts/basic-layout', 'layouts/visitor-wrapper'],
      bodyClass: ['page--OL-combine']
    });
  });

  return router;
}
