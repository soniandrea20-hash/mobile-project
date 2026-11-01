import { UnprocessableEntityException } from '@nestjs/common';
import sharp from 'sharp';
import { BlobContentStorage } from 'src/content/infraestructure/blob-content-storage';
import { BlobImageStorage } from 'src/products/infraestructure/blob-image-storage';

const CACHE = 'public, max-age=31536000, immutable';

describe('Blob storage adapters', () => {
  const blob = { uploadData: jest.fn(), deleteIfExists: jest.fn() };
  const container = { getBlockBlobClient: jest.fn(() => blob) } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    blob.uploadData.mockResolvedValue({});
    blob.deleteIfExists.mockResolvedValue({});
  });

  describe('BlobImageStorage', () => {
    const storage = () => new BlobImageStorage(container);
    const solid = (width: number) =>
      sharp({ create: { width, height: 100, channels: 3, background: '#ff0000' } }).png().toBuffer();

    it('debe subir la imagen reducida a 1280 px con content-type y cache inmutable', async () => {
      const imagePath = await storage().save('t1', await solid(4000), 'png');

      expect(imagePath).toMatch(/^t1\/products\/[0-9a-f-]{36}\.png$/);
      expect(container.getBlockBlobClient).toHaveBeenCalledWith(imagePath);
      const [data, options] = blob.uploadData.mock.calls[0];
      expect((await sharp(data).metadata()).width).toBeLessThanOrEqual(1280);
      expect(options.blobHTTPHeaders).toEqual({ blobContentType: 'image/png', blobCacheControl: CACHE });
    });

    it('debe fallar con MEDIA_UNREADABLE sin subir nada si no se puede decodificar', async () => {
      const corrupt = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32, 1)]);
      const error: any = await storage().save('t1', corrupt, 'png').catch((e) => e);

      expect(error).toBeInstanceOf(UnprocessableEntityException);
      expect(blob.uploadData).not.toHaveBeenCalled();
    });

    it('remove debe borrar el blob y tragarse los errores', async () => {
      await storage().remove('t1/products/a.png');
      expect(container.getBlockBlobClient).toHaveBeenCalledWith('t1/products/a.png');
      expect(blob.deleteIfExists).toHaveBeenCalled();

      blob.deleteIfExists.mockRejectedValue(new Error('azure down'));
      await expect(storage().remove('t1/products/a.png')).resolves.toBeUndefined();
    });
  });

  describe('BlobContentStorage', () => {
    const storage = () => new BlobContentStorage(container);

    it('debe subir los bytes intactos con content-type segun la extension', async () => {
      const bytes = Buffer.from('video-bytes');
      const filePath = await storage().save('t1', bytes, 'mp4');

      expect(filePath).toMatch(/^t1\/content\/[0-9a-f-]{36}\.mp4$/);
      expect(container.getBlockBlobClient).toHaveBeenCalledWith(filePath);
      const [data, options] = blob.uploadData.mock.calls[0];
      expect(data).toBe(bytes);
      expect(options.blobHTTPHeaders).toEqual({ blobContentType: 'video/mp4', blobCacheControl: CACHE });
    });

    it('remove debe borrar el blob y tragarse los errores', async () => {
      await storage().remove('t1/content/a.jpg');
      expect(blob.deleteIfExists).toHaveBeenCalled();

      blob.deleteIfExists.mockRejectedValue(new Error('azure down'));
      await expect(storage().remove('t1/content/a.jpg')).resolves.toBeUndefined();
    });
  });
});
