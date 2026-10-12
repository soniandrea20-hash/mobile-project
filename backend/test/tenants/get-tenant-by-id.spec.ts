import { NotFoundException } from '@nestjs/common';
import { GetTenantByIdUseCase } from 'src/tenants/application/get-by-id.use-case';

describe('GetTenantByIdUseCase', () => {
  let useCase: GetTenantByIdUseCase;

  const tenantRepository = {
    getById: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetTenantByIdUseCase(tenantRepository as any);
  });

  it('debe devolver el tenant cuando existe', async () => {
    const tenant = { tenant_id: 'id-1', name: 'acme', is_active: true };
    tenantRepository.getById.mockResolvedValue(tenant);

    const result = await useCase.execute('id-1');

    expect(tenantRepository.getById).toHaveBeenCalledWith('id-1');
    expect(result).toEqual(tenant);
  });

  it('debe fallar cuando el tenant no existe', async () => {
    tenantRepository.getById.mockResolvedValue(null);

    await expect(useCase.execute('missing-id')).rejects.toThrow(
      NotFoundException,
    );
  });
});
