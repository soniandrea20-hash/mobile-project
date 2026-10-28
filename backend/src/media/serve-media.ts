import { NestExpressApplication } from '@nestjs/platform-express';

// Express static runs before Nest routing, so TenantMiddleware and guards never see /media.
export const serveMedia = (app: NestExpressApplication, dir: string) =>
  app.useStaticAssets(dir, {
    prefix: '/media',
    index: false,
    redirect: false,
    setHeaders: (res) => res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'),
  });
