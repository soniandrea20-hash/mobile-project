import { ConflictException } from '@nestjs/common';
import { CreateTenantUseCase } from 'src/tenants/application/create.use-case';

describe('CreateTenantUseCase', () => {
  let useCase: CreateTenantUseCase;

  const tenantRepository = {
    getByName: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateTenantUseCase(tenantRepository as any);
  });

  it('debe crear un tenant cuando el nombre no existe', async () => {
    tenantRepository.getByName.mockResolvedValue(null);
    tenantRepository.create.mockResolvedValue({
      tenant_id: 'tenant-id',
      name: 'Acme',
      is_active: true,
    });

    const result = await useCase.execute({ name: '  Acme  ' });

    expect(tenantRepository.getByName).toHaveBeenCalledWith('acme');
    expect(tenantRepository.create).toHaveBeenCalledWith({ name: 'Acme' });
    expect(result.tenant_id).toBe('tenant-id');
  });

  it('debe fallar cuando el nombre ya existe', async () => {
    tenantRepository.getByName.mockResolvedValue({
      tenant_id: 'existing-id',
      name: 'acme',
      is_active: true,
    });

    await expect(useCase.execute({ name: 'Acme' })).rejects.toThrow(
      ConflictException,
    );
    expect(tenantRepository.create).not.toHaveBeenCalled();
  });
});
