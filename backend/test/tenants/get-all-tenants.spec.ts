import { GetAllTenantsUseCase } from 'src/tenants/application/get-all.use-case';

describe('GetAllTenantsUseCase', () => {
  let useCase: GetAllTenantsUseCase;

  const tenantRepository = {
    getAll: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetAllTenantsUseCase(tenantRepository as any);
  });

  it('debe devolver todos los tenants', async () => {
    const tenants = [
      { tenant_id: 'id-1', name: 'acme', is_active: true },
      { tenant_id: 'id-2', name: 'globex', is_active: false },
    ];
    tenantRepository.getAll.mockResolvedValue(tenants);

    const result = await useCase.execute();

    expect(tenantRepository.getAll).toHaveBeenCalled();
    expect(result).toEqual(tenants);
  });

  it('debe devolver una lista vacia cuando no hay tenants', async () => {
    tenantRepository.getAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
