import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateContentUseCase } from 'src/content/application/create-content.use-case';
import { DeleteContentUseCase } from 'src/content/application/delete-content.use-case';
import { ListContentUseCase } from 'src/content/application/list-content.use-case';
import { ReorderContentUseCase } from 'src/content/application/reorder-content.use-case';
import { UpdateContentUseCase } from 'src/content/application/update-content.use-case';
import { detectMedia } from 'src/content/domain/content-media';

const expectCode = async (promise: Promise<unknown>, type: any, code: string) => {
  const error: any = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(type);
  expect(error.getResponse()).toMatchObject({ code });
};

const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.alloc(8)]);

const row = (over: object = {}) => ({
  content_id: 'c1', store_id: 's1', type: 'image', file_path: 't1/content/a.jpg', original_name: 'a.jpg',
  mime_type: 'image/jpeg', size_bytes: '100', duration_seconds: 10, sort_order: 1, is_visible: true,
  created_at: new Date(), updated_at: new Date(), ...over,
});

describe('Content use cases', () => {
  const tenant = { tenant_id: 't1' } as any;
  const repo = {
    listByStore: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), reorder: jest.fn(), delete: jest.fn(),
  };
  const tenantRepository = { isStoreOfTenant: jest.fn() };
  const storage = { save: jest.fn(), remove: jest.fn() };
  const probe = { durationSeconds: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    delete process.env.DEFAULT_IMAGE_SECONDS;
    tenantRepository.isStoreOfTenant.mockResolvedValue(true);
    storage.save.mockResolvedValue('t1/content/new.jpg');
    repo.create.mockImplementation(async (_t, d) => row({ ...d, sort_order: 3 }));
  });

  describe('detectMedia', () => {
    it('debe reconocer jpg y mp4 por su contenido', () => {
      expect(detectMedia(JPG)).toMatchObject({ type: 'image', ext: 'jpg', mime: 'image/jpeg' });
      expect(detectMedia(MP4)).toMatchObject({ type: 'video', ext: 'mp4', mime: 'video/mp4' });
    });

    it('debe rechazar otros formatos', () => {
      expect(detectMedia(Buffer.from('MZ-exe-file-bytes'))).toBeNull();
    });
  });

  describe('ListContentUseCase', () => {
    const useCase = () => new ListContentUseCase(repo as any, tenantRepository as any);

    it('debe fallar con STORE_NOT_FOUND si el local no es del tenant', async () => {
      tenantRepository.isStoreOfTenant.mockResolvedValue(false);
      await expectCode(useCase().execute(tenant, 's1'), NotFoundException, 'STORE_NOT_FOUND');
      expect(repo.listByStore).not.toHaveBeenCalled();
    });

    it('debe listar con tenant y local, con url de /media', async () => {
      repo.listByStore.mockResolvedValue([row(), row({ content_id: 'c2', is_visible: false })]);
      const result = await useCase().execute(tenant, 's1');

      expect(repo.listByStore).toHaveBeenCalledWith('t1', 's1');
      expect(result[0]).toMatchObject({ content_id: 'c1', url: '/media/t1/content/a.jpg', size_bytes: 100 });
      expect(result[1].is_visible).toBe(false);
      expect(result[0]).not.toHaveProperty('file_path');
    });
  });

  describe('CreateContentUseCase', () => {
    const useCase = () => new CreateContentUseCase(repo as any, tenantRepository as any, storage as any, probe as any);
    const input = (over: object = {}) => ({ store_id: 's1', file: JPG, original_name: 'a.jpg', ...over });

    it('debe fallar con STORE_NOT_FOUND sin guardar el archivo', async () => {
      tenantRepository.isStoreOfTenant.mockResolvedValue(false);
      await expectCode(useCase().execute(tenant, input()), NotFoundException, 'STORE_NOT_FOUND');
      expect(storage.save).not.toHaveBeenCalled();
    });

    it('debe rechazar con 415 un formato desconocido', async () => {
      const error: any = await useCase().execute(tenant, input({ file: Buffer.from('MZ-exe-file-bytes') })).catch((e) => e);
      expect(error.getStatus()).toBe(415);
      expect(error.getResponse()).toMatchObject({ code: 'UNSUPPORTED_MEDIA_TYPE' });
      expect(storage.save).not.toHaveBeenCalled();
    });

    it('imagen: 5 242 880 bytes se acepta y 5 242 881 da 413 MEDIA_TOO_LARGE', async () => {
      const big = (n: number) => Buffer.concat([JPG, Buffer.alloc(n - JPG.length)]);
      await useCase().execute(tenant, input({ file: big(5_242_880) }));
      const error: any = await useCase().execute(tenant, input({ file: big(5_242_881) })).catch((e) => e);
      expect(error.getStatus()).toBe(413);
      expect(error.getResponse()).toMatchObject({ code: 'MEDIA_TOO_LARGE' });
    });

    it('imagen: duracion por defecto 10 (o DEFAULT_IMAGE_SECONDS) y se agrega visible', async () => {
      const item = await useCase().execute(tenant, input());
      expect(repo.create).toHaveBeenCalledWith('t1', expect.objectContaining({
        store_id: 's1', type: 'image', file_path: 't1/content/new.jpg', original_name: 'a.jpg',
        mime_type: 'image/jpeg', size_bytes: JPG.length, duration_seconds: 10,
      }));
      expect(item.url).toBe('/media/t1/content/new.jpg');
      expect(probe.durationSeconds).not.toHaveBeenCalled();

      process.env.DEFAULT_IMAGE_SECONDS = '7';
      await useCase().execute(tenant, input());
      expect(repo.create).toHaveBeenLastCalledWith('t1', expect.objectContaining({ duration_seconds: 7 }));
    });

    it('imagen: usa la duracion enviada', async () => {
      await useCase().execute(tenant, input({ duration_seconds: 25 }));
      expect(repo.create).toHaveBeenCalledWith('t1', expect.objectContaining({ duration_seconds: 25 }));
    });

    it('video: mide con ffprobe y guarda la duracion', async () => {
      storage.save.mockResolvedValue('t1/content/v.mp4');
      probe.durationSeconds.mockResolvedValue(42);
      await useCase().execute(tenant, input({ file: MP4, original_name: 'v.mp4' }));

      expect(probe.durationSeconds).toHaveBeenCalledWith('t1/content/v.mp4');
      expect(repo.create).toHaveBeenCalledWith('t1', expect.objectContaining({ type: 'video', mime_type: 'video/mp4', duration_seconds: 42 }));
    });

    it('video: exactamente 60 s se acepta; 61 da 422 VIDEO_TOO_LONG y borra el archivo', async () => {
      storage.save.mockResolvedValue('t1/content/v.mp4');
      probe.durationSeconds.mockResolvedValueOnce(60);
      await useCase().execute(tenant, input({ file: MP4 }));

      probe.durationSeconds.mockResolvedValueOnce(61);
      const error: any = await useCase().execute(tenant, input({ file: MP4 })).catch((e) => e);
      expect(error.getStatus()).toBe(422);
      expect(error.getResponse()).toMatchObject({ code: 'VIDEO_TOO_LONG' });
      expect(storage.remove).toHaveBeenCalledWith('t1/content/v.mp4');
    });

    it('video: 52 428 801 bytes da 413 y 52 428 800 se acepta', async () => {
      probe.durationSeconds.mockResolvedValue(10);
      const big = (n: number) => Buffer.concat([MP4, Buffer.alloc(n - MP4.length)]);
      await useCase().execute(tenant, input({ file: big(52_428_800) }));
      const error: any = await useCase().execute(tenant, input({ file: big(52_428_801) })).catch((e) => e);
      expect(error.getStatus()).toBe(413);
    });

    it('video: ffprobe falla -> 422 MEDIA_UNREADABLE y borra el archivo', async () => {
      probe.durationSeconds.mockRejectedValue(new Error('boom'));
      const error: any = await useCase().execute(tenant, input({ file: MP4 })).catch((e) => e);
      expect(error.getStatus()).toBe(422);
      expect(error.getResponse()).toMatchObject({ code: 'MEDIA_UNREADABLE' });
      expect(storage.remove).toHaveBeenCalledWith('t1/content/new.jpg');
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('video: duration_seconds enviado da 422 sin guardar el archivo', async () => {
      const error: any = await useCase().execute(tenant, input({ file: MP4, duration_seconds: 10 })).catch((e) => e);
      expect(error.getStatus()).toBe(422);
      expect(storage.save).not.toHaveBeenCalled();
    });

    it('debe borrar el archivo si falla el insert', async () => {
      repo.create.mockRejectedValue(new Error('db'));
      await expect(useCase().execute(tenant, input())).rejects.toThrow('db');
      expect(storage.remove).toHaveBeenCalledWith('t1/content/new.jpg');
    });
  });

  describe('UpdateContentUseCase', () => {
    const useCase = () => new UpdateContentUseCase(repo as any);

    it('debe fallar con 400 EMPTY_UPDATE sin campos', async () => {
      await expectCode(useCase().execute(tenant, 'c1', {}), BadRequestException, 'EMPTY_UPDATE');
    });

    it('debe fallar con 404 si el contenido no es del tenant', async () => {
      repo.findOne.mockResolvedValue(null);
      await expectCode(useCase().execute(tenant, 'c1', { is_visible: false }), NotFoundException, 'CONTENT_NOT_FOUND');
      expect(repo.findOne).toHaveBeenCalledWith('t1', 'c1');
    });

    it('debe rechazar con 422 la duracion en un video', async () => {
      repo.findOne.mockResolvedValue(row({ type: 'video' }));
      const error: any = await useCase().execute(tenant, 'c1', { duration_seconds: 15 }).catch((e) => e);
      expect(error.getStatus()).toBe(422);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('debe permitir ocultar un video', async () => {
      repo.findOne.mockResolvedValue(row({ type: 'video' }));
      repo.update.mockResolvedValue(row({ type: 'video', is_visible: false }));
      const item = await useCase().execute(tenant, 'c1', { is_visible: false });
      expect(repo.update).toHaveBeenCalledWith('t1', 'c1', { is_visible: false });
      expect(item.is_visible).toBe(false);
    });

    it('debe actualizar la duracion de una imagen', async () => {
      repo.findOne.mockResolvedValue(row());
      repo.update.mockResolvedValue(row({ duration_seconds: 15 }));
      const item = await useCase().execute(tenant, 'c1', { duration_seconds: 15 });
      expect(repo.update).toHaveBeenCalledWith('t1', 'c1', { duration_seconds: 15 });
      expect(item.duration_seconds).toBe(15);
    });
  });

  describe('ReorderContentUseCase', () => {
    const useCase = () => new ReorderContentUseCase(repo as any, tenantRepository as any);
    const current = [row({ content_id: 'a' }), row({ content_id: 'b' }), row({ content_id: 'c', is_visible: false })];

    beforeEach(() => repo.listByStore.mockResolvedValue(current));

    it('debe fallar con STORE_NOT_FOUND', async () => {
      tenantRepository.isStoreOfTenant.mockResolvedValue(false);
      await expectCode(useCase().execute(tenant, 's1', ['a']), NotFoundException, 'STORE_NOT_FOUND');
    });

    it('debe rechazar con 422 si falta, sobra o es ajeno algun contenido', async () => {
      for (const ids of [['a', 'b'], ['a', 'b', 'c', 'd'], ['a', 'b', 'x']]) {
        const error: any = await useCase().execute(tenant, 's1', ids).catch((e) => e);
        expect(error.getStatus()).toBe(422);
      }
      expect(repo.reorder).not.toHaveBeenCalled();
    });

    it('debe reasignar el orden incluyendo ocultos y devolver el nuevo orden', async () => {
      repo.reorder.mockResolvedValue([row({ content_id: 'c' }), row({ content_id: 'a' }), row({ content_id: 'b' })]);
      const result = await useCase().execute(tenant, 's1', ['c', 'a', 'b']);
      expect(repo.reorder).toHaveBeenCalledWith('t1', 's1', ['c', 'a', 'b']);
      expect(result.map((i) => i.content_id)).toEqual(['c', 'a', 'b']);
    });
  });

  describe('DeleteContentUseCase', () => {
    const useCase = () => new DeleteContentUseCase(repo as any, storage as any);

    it('debe fallar con 404 si no existe en el tenant', async () => {
      repo.delete.mockResolvedValue(null);
      await expectCode(useCase().execute(tenant, 'c1'), NotFoundException, 'CONTENT_NOT_FOUND');
      expect(storage.remove).not.toHaveBeenCalled();
    });

    it('debe borrar la fila y luego el archivo', async () => {
      repo.delete.mockResolvedValue(row());
      await useCase().execute(tenant, 'c1');
      expect(repo.delete).toHaveBeenCalledWith('t1', 'c1');
      expect(storage.remove).toHaveBeenCalledWith('t1/content/a.jpg');
    });
  });
});
