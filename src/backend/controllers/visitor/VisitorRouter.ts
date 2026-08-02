import { NextFunction, Request, Response, Router } from 'express';
import { create } from '../../routing/router.ts';
import { SiteUserProvider } from '../../middleware/auth/SiteUserProvider.ts';
import SitePrivacyPolicyPage from '../../components/site/SitePrivacyPolicyPage.vue';
import SiteTermsOfServicePage from '../../components/site/SiteTermsOfServicePage.vue';
import SiteContactPage from '../../components/site/SiteContactPage.vue';
import OLGenPage from '../../components/shared/OLGenPage.vue';
import OLCombinePage from '../../components/shared/OLCombinePage.vue';
import { doubleCsrfProtection } from '../../middleware/request/csrf.ts';

export default async function(): Promise<Router> {
  const router: Router = create(null, r => {
    r.use(doubleCsrfProtection);
  });

  router.get('/privacy', async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || (await SiteUserProvider.isBanned(req.user))) {
      await res.renderComponent(SitePrivacyPolicyPage, {
        title: 'Privacy Policy',
        layoutType: 'basic',
        bodyClass: ['page--docs', 'page--privacy'],
      });
    } else {
      await res.renderComponent(SitePrivacyPolicyPage, {
        title: 'Privacy Policy',
        layoutType: 'app',
        bodyClass: ['page--docs', 'page--privacy', 'page--larger'],
      });
    }
  });

  router.get('/terms', async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || (await SiteUserProvider.isBanned(req.user))) {
      await res.renderComponent(SiteTermsOfServicePage, {
        title: 'Terms of Service',
        layoutType: 'basic',
        bodyClass: ['page--docs', 'page--terms'],
      });
    } else {
      await res.renderComponent(SiteTermsOfServicePage, {
        title: 'Terms of Service',
        layoutType: 'app',
        bodyClass: ['page--docs', 'page--terms', 'page--larger'],
      });
    }
  });

  router.get('/contact', async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || (await SiteUserProvider.isBanned(req.user))) {
      await res.renderComponent(SiteContactPage, {
        title: 'Contact',
        layoutType: 'basic',
        bodyClass: ['page--docs', 'page--contact'],
      });
    } else {
      await res.renderComponent(SiteContactPage, {
        title: 'Contact',
        layoutType: 'app',
        bodyClass: ['page--docs', 'page--contact', 'page--larger'],
      });
    }
  });

  router.get('/genshin/OL', async (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    await res.renderComponent(OLGenPage, {
      title: 'OL',
      layoutType: 'visitor',
      bodyClass: ['page--OL']
    });
  });
  router.get(['/hsr/OL', '/zenless/OL', '/wuwa/OL'], async (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    await res.renderComponent(OLGenPage, {
      title: 'OL',
      layoutType: 'visitor',
      bodyClass: ['page--OL'],
    });
  });
  router.get(['/genshin/OL/combine', '/hsr/OL/combine', '/zenless/OL/combine', '/wuwa/OL/combine'], async (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    await res.renderComponent(OLCombinePage, {
      title: 'OL Combine',
      layoutType: 'visitor',
      bodyClass: ['page--OL-combine']
    });
  });

  return router;
}
