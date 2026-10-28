import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { serveMedia } from './media/serve-media';
import { uploadsDir } from './media/uploads-dir';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  serveMedia(app, uploadsDir());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )

  app.enableCors({
    origin: [
      'http://localhost:8081',
      /^https?:\/\/[a-z0-9-]+\.localhost(:\d+)?$/,
      /^https:\/\/[a-z0-9-]+\.mostrador\.io$/,
    ],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Tenant-Slug', 'If-None-Match'],
    exposedHeaders: ['ETag'],
  });

  await app.listen(process.env.PORT ?? 3000);
};

bootstrap();

