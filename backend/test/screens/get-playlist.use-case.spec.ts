import { NotFoundException } from '@nestjs/common';
import { GetPlaylistUseCase } from 'src/screens/application/get-playlist.use-case';

describe('GetPlaylistUseCase', () => {
  const tenant = { tenant_id: 't1', slug: 'local1' } as any;
  const screenRepository = { findPlayerScreen: jest.fn() };
  const contentRepository = { listByStore: jest.fn() };
  const screen = (over: object = {}) => ({ screen_id: 'sc1', store_id: 's1', store_name: 'Palermo', store_slug: 'palermo', ...over });
  const item = (over: object = {}) => ({
    content_id: 'c1', type: 'image', file_path: 't1/content/c1.jpg', duration_seconds: 10, sort_order: 1, is_visible: true, ...over,
  });
  const useCase = () => new GetPlaylistUseCase(screenRepository as any, contentRepository as any);

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WEB_ORIGIN_TEMPLATE = 'http://{slug}.localhost:8081';
    screenRepository.findPlayerScreen.mockResolvedValue(screen());
    contentRepository.listByStore.mockResolvedValue([item()]);
  });

  it('debe fallar con SCREEN_NOT_FOUND si el token no existe, está inactivo o es de otro tenant', async () => {
    screenRepository.findPlayerScreen.mockResolvedValue(null);

    const error: any = await useCase().execute(tenant, 'tok').catch((e) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect(error.getResponse()).toMatchObject({ code: 'SCREEN_NOT_FOUND' });
    expect(screenRepository.findPlayerScreen).toHaveBeenCalledWith('t1', 'tok');
    expect(contentRepository.listByStore).not.toHaveBeenCalled();
  });

  it('debe armar la respuesta con claves en el orden del contrato', async () => {
    const playlist = await useCase().execute(tenant, 'tok');

    expect(Object.keys(playlist)).toEqual(['version', 'poll_interval_seconds', 'store', 'qr_url', 'items']);
    expect(playlist.poll_interval_seconds).toBe(30);
    expect(playlist.store).toEqual({ name: 'Palermo', slug: 'palermo' });
    expect(playlist.qr_url).toBe('http://local1.localhost:8081/palermo?src=sc1');
    expect(playlist.items).toEqual([{ content_id: 'c1', type: 'image', url: '/media/t1/content/c1.jpg', duration_seconds: 10 }]);
  });

  it('debe incluir solo los visibles, en orden de sort_order', async () => {
    contentRepository.listByStore.mockResolvedValue([
      item({ content_id: 'a', sort_order: 1 }),
      item({ content_id: 'b', sort_order: 2, is_visible: false }),
      item({ content_id: 'c', sort_order: 3 }),
    ]);

    const playlist = await useCase().execute(tenant, 'tok');

    expect(playlist.items.map((i) => i.content_id)).toEqual(['a', 'c']);
  });

  it('debe devolver items vacío y versión de 16 hex si no hay contenido visible', async () => {
    contentRepository.listByStore.mockResolvedValue([item({ is_visible: false })]);

    const playlist = await useCase().execute(tenant, 'tok');

    expect(playlist.items).toEqual([]);
    expect(playlist.version).toMatch(/^[0-9a-f]{16}$/);
  });

  it('debe dar la misma versión con los mismos datos', async () => {
    const a = await useCase().execute(tenant, 'tok');
    const b = await useCase().execute(tenant, 'tok');

    expect(a.version).toBe(b.version);
  });

  it.each([
    ['cambia la duración', () => contentRepository.listByStore.mockResolvedValue([item({ duration_seconds: 20 })])],
    ['se oculta el contenido', () => contentRepository.listByStore.mockResolvedValue([item({ is_visible: false })])],
    ['se agrega contenido', () => contentRepository.listByStore.mockResolvedValue([item(), item({ content_id: 'c2', sort_order: 2 })])],
    ['cambia el nombre del local', () => screenRepository.findPlayerScreen.mockResolvedValue(screen({ store_name: 'Centro' }))],
    ['cambia el slug del local', () => screenRepository.findPlayerScreen.mockResolvedValue(screen({ store_slug: 'centro' }))],
  ])('debe cambiar la versión cuando %s', async (_name, change) => {
    const before = await useCase().execute(tenant, 'tok');
    change();
    const after = await useCase().execute(tenant, 'tok');

    expect(after.version).not.toBe(before.version);
  });

  it('debe cambiar la versión al reordenar', async () => {
    const two = [item({ content_id: 'a', sort_order: 1 }), item({ content_id: 'b', sort_order: 2 })];
    contentRepository.listByStore.mockResolvedValue(two);
    const before = await useCase().execute(tenant, 'tok');
    contentRepository.listByStore.mockResolvedValue([{ ...two[1], sort_order: 1 }, { ...two[0], sort_order: 2 }]);
    const after = await useCase().execute(tenant, 'tok');

    expect(after.version).not.toBe(before.version);
  });
});
