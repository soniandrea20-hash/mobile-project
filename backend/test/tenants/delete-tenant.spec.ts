import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeleteTenantUseCase } from 'src/tenants/application/delete.use-case';

describe('DeleteTenantUseCase', () => {
  let useCase: DeleteTenantUseCase;

  const tenantRepository = {
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new DeleteTenantUseCase(tenantRepository as any);
  });

  it('debe desactivar el tenant en lugar de borrarlo', async () => {
    tenantRepository.getById.mockResolvedValue({
      tenant_id: 'id-1',
      name: 'acme',
      is_active: true,
    });
    tenantRepository.update.mockResolvedValue({
      tenant_id: 'id-1',
      name: 'acme',
      is_active: false,
    });

    await useCase.execute('id-1');

    expect(tenantRepository.update).toHaveBeenCalledWith('id-1', {
      is_active: false,
    });
    expect(tenantRepository.delete).not.toHaveBeenCalled();
  });

  it('debe fallar cuando el tenant no existe', async () => {
    tenantRepository.getById.mockResolvedValue(null);

    await expect(useCase.execute('missing-id')).rejects.toThrow(
      NotFoundException,
    );
    expect(tenantRepository.update).not.toHaveBeenCalled();
  });

  it('debe fallar cuando el tenant ya esta desactivado', async () => {
    tenantRepository.getById.mockResolvedValue({
      tenant_id: 'id-1',
      name: 'acme',
      is_active: false,
    });

    await expect(useCase.execute('id-1')).rejects.toThrow(BadRequestException);
    expect(tenantRepository.update).not.toHaveBeenCalled();
  });
});
