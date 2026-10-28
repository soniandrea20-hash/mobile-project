import { Controller, MiddlewareConsumer, Module, NestModule, NotFoundException, Post, UploadedFile, UseFilters, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { serveMedia } from 'src/media/serve-media';
import { IMAGE_UPLOAD_OPTIONS } from 'src/products/api/image-upload';
import { MediaTooLargeFilter } from 'src/products/api/media-too-large.filter';
import { IMAGE_MAX_BYTES } from 'src/products/domain/product-image';

@Controller('upload')
class UploadStubController {
  @Post()
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  @UseFilters(MediaTooLargeFilter)
  upload(@UploadedFile() file?: { size: number }) {
    return { size: file?.size ?? null };
  }
}

@Module({ controllers: [UploadStubController] })
class UploadModule {}

// Stands in for TenantMiddleware: every request that reaches Nest routing is rejected.
const rejectEverything = () => {
  throw new NotFoundException({ code: 'TENANT_NOT_FOUND' });
};

@Module({})
class RejectingModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(rejectEverything).forRoutes('*');
  }
}

const createApp = async (module: any, dir?: string) => {
  const moduleRef = await Test.createTestingModule({ imports: [module] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();
  if (dir) serveMedia(app, dir);
  await app.init();
  return app;
};

describe('image upload limit', () => {
  let app: NestExpressApplication;
  beforeAll(async () => {
    app = await createApp(UploadModule);
  });
  afterAll(() => app.close());

  const upload = (size: number) => request(app.getHttpServer()).post('/upload').attach('file', Buffer.alloc(size), 'a.jpg');

  it('debe configurar el limite en exactamente 5 242 880 bytes', () => {
    expect(IMAGE_UPLOAD_OPTIONS.limits.fileSize).toBe(5_242_880);
    expect(IMAGE_MAX_BYTES).toBe(5_242_880);
  });

  it('TC-034: exactamente 5 242 880 bytes se acepta', async () => {
    const res = await upload(IMAGE_MAX_BYTES);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ size: IMAGE_MAX_BYTES });
  });

  it('TC-033: 5 242 881 bytes da 413 MEDIA_TOO_LARGE', async () => {
    const res = await upload(IMAGE_MAX_BYTES + 1);

    expect(res.status).toBe(413);
    expect(res.body).toMatchObject({ statusCode: 413, error: 'Payload Too Large', code: 'MEDIA_TOO_LARGE' });
    expect(typeof res.body.message).toBe('string');
  });
});

describe('GET /media/*', () => {
  let app: NestExpressApplication;
  let dir: string;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'media-'));
    await mkdir(join(dir, 't1', 'products'), { recursive: true });
    await writeFile(join(dir, 't1', 'products', 'a.png'), 'png-bytes');
    app = await createApp(RejectingModule, dir);
  });
  afterAll(async () => {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  });

  it('debe servir el archivo aunque el middleware de tenant rechace todo, con cache inmutable', async () => {
    const routed = await request(app.getHttpServer()).get('/otra-ruta');
    const res = await request(app.getHttpServer()).get('/media/t1/products/a.png');

    expect(routed.status).toBe(404);
    expect(routed.body).toMatchObject({ code: 'TENANT_NOT_FOUND' });
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable');
  });

  it('debe dar 404 si no existe y no listar directorios', async () => {
    expect((await request(app.getHttpServer()).get('/media/t1/products/nope.png')).status).toBe(404);
    const listing = await request(app.getHttpServer()).get('/media/t1/products/');
    expect(listing.status).toBe(404);
    expect(listing.text).not.toContain('a.png');
  });

  it('no debe salir de UPLOADS_DIR con path traversal', async () => {
    const res = await request(app.getHttpServer()).get('/media/..%2f..%2fpackage.json');
    expect(res.status).not.toBe(200);
  });
});
