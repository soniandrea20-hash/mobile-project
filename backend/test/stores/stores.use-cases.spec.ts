import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GetStoreUseCase } from 'src/stores/application/get-store.use-case';
import { ListStoresUseCase } from 'src/stores/application/list-stores.use-case';
import { UpdateStoreUseCase } from 'src/stores/application/update-store.use-case';

const expectCode = async (promise: Promise<unknown>, type: any, code: string) => {
  const error: any = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(type);
  expect(error.getResponse()).toMatchObject({ code });
};

describe('Stores use cases', () => {
  const tenant = { tenant_id: 't1', slug: 'local1' } as any;
  const storeRepository = { list: jest.fn(), findById: jest.fn(), update: jest.fn() };
  const row = (over: object = {}) => ({
    store_id: 's1', name: 'Palermo', slug: 'palermo', address: null, phone: null,
    whatsapp_number: '+5491112345678', is_active: true, created_at: new Date(), ...over,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WEB_ORIGIN_TEMPLATE = 'http://{slug}.localhost:8081';
  });

  describe('ListStoresUseCase', () => {
    it('debe listar los locales del tenant con su self_order_url', async () => {
      storeRepository.list.mockResolvedValue([row(), row({ store_id: 's2', slug: 'centro' })]);

      const result = await new ListStoresUseCase(storeRepository as any).execute(tenant);

      expect(storeRepository.list).toHaveBeenCalledWith('t1');
      expect(result.map((s) => s.self_order_url)).toEqual([
        'http://local1.localhost:8081/palermo',
        'http://local1.localhost:8081/centro',
      ]);
    });
  });

  describe('GetStoreUseCase', () => {
    const useCase = () => new GetStoreUseCase(storeRepository as any);

    it('debe devolver el local con su self_order_url', async () => {
      storeRepository.findById.mockResolvedValue(row());

      const store = await useCase().execute(tenant, 's1');

      expect(storeRepository.findById).toHaveBeenCalledWith('t1', 's1');
      expect(store.self_order_url).toBe('http://local1.localhost:8081/palermo');
    });

    it('debe fallar con STORE_NOT_FOUND si el local no es del tenant', async () => {
      storeRepository.findById.mockResolvedValue(null);

      await expectCode(useCase().execute(tenant, 'otro'), NotFoundException, 'STORE_NOT_FOUND');
    });
  });

  describe('UpdateStoreUseCase', () => {
    const useCase = () => new UpdateStoreUseCase(storeRepository as any);

    it('debe actualizar los campos enviados y devolver el local con self_order_url', async () => {
      storeRepository.update.mockImplementation(async (_t, _id, patch) => row(patch));

      const store = await useCase().execute(tenant, 's1', { name: '  Palermo Centro  ', phone: '+541145550000' });

      expect(storeRepository.update).toHaveBeenCalledWith('t1', 's1', { name: 'Palermo Centro', phone: '+541145550000' });
      expect(store.name).toBe('Palermo Centro');
      expect(store.self_order_url).toBe('http://local1.localhost:8081/palermo');
    });

    it('debe enviar null al repositorio para borrar el whatsapp_number', async () => {
      storeRepository.update.mockImplementation(async (_t, _id, patch) => row(patch));

      const store = await useCase().execute(tenant, 's1', { whatsapp_number: null });

      expect(storeRepository.update).toHaveBeenCalledWith('t1', 's1', { whatsapp_number: null });
      expect(store.whatsapp_number).toBeNull();
    });

    it('debe fallar con EMPTY_UPDATE si no se envia ningun campo', async () => {
      await expectCode(useCase().execute(tenant, 's1', {}), BadRequestException, 'EMPTY_UPDATE');
      expect(storeRepository.update).not.toHaveBeenCalled();
    });

    it('debe fallar con STORE_NOT_FOUND si el local no es del tenant', async () => {
      storeRepository.update.mockResolvedValue(null);

      await expectCode(useCase().execute(tenant, 'otro', { name: 'X' }), NotFoundException, 'STORE_NOT_FOUND');
    });
  });
});
