import { NestExpressApplication } from '@nestjs/platform-express';

// Express static runs before Nest routing, so TenantMiddleware and guards never see /media.
export const serveMedia = (app: NestExpressApplication, dir: string) => {
  app.useStaticAssets(dir, {
    prefix: '/media',
    index: false,
    redirect: false,
    setHeaders: (res) => res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'),
  });
  // A missing file stops here with a plain 404 instead of falling through to TenantMiddleware.
  app.use('/media', (_req, res) =>
    res.status(404).json({ statusCode: 404, message: 'File not found', error: 'Not Found', code: 'MEDIA_NOT_FOUND' }),
  );
};
