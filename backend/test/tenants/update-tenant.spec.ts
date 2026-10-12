import { ConflictException, NotFoundException } from '@nestjs/common';
import {  UpdateTenantUseCase } from 'src/tenants/application/update.use-case';

describe('UpdateTenantUseCase', () => {
  let useCase: UpdateTenantUseCase;

  const tenantRepository = {
    getById: jest.fn(),
    getByName: jest.fn(),
    update: jest.fn(),
  };

  const existing = { tenant_id: 'id-1', name: 'acme', is_active: true };

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UpdateTenantUseCase(tenantRepository as any);
  });

  it('debe actualizar el nombre del tenant', async () => {
    tenantRepository.getById.mockResolvedValue(existing);
    tenantRepository.getByName.mockResolvedValue(null);
    tenantRepository.update.mockResolvedValue({ ...existing, name: 'Globex' });

    const result = await useCase.execute('id-1', { name: '  Globex  ' });

    expect(tenantRepository.getByName).toHaveBeenCalledWith('globex');
    expect(tenantRepository.update).toHaveBeenCalledWith('id-1', {
      name: 'Globex',
    });
    expect(result.name).toBe('Globex');
  });

  it('debe fallar cuando el tenant no existe', async () => {
    tenantRepository.getById.mockResolvedValue(null);

    await expect(
      useCase.execute('missing-id', { name: 'Globex' }),
    ).rejects.toThrow(NotFoundException);
    expect(tenantRepository.update).not.toHaveBeenCalled();
  });

  it('debe fallar cuando el nombre pertenece a otro tenant', async () => {
    tenantRepository.getById.mockResolvedValue(existing);
    tenantRepository.getByName.mockResolvedValue({
      tenant_id: 'id-2',
      name: 'globex',
      is_active: true,
    });

    await expect(useCase.execute('id-1', { name: 'Globex' })).rejects.toThrow(
      ConflictException,
    );
    expect(tenantRepository.update).not.toHaveBeenCalled();
  });

  it('debe permitir guardar el mismo nombre del propio tenant', async () => {
    tenantRepository.getById.mockResolvedValue(existing);
    tenantRepository.getByName.mockResolvedValue(existing);
    tenantRepository.update.mockResolvedValue({ ...existing, name: 'Acme' });

    await expect(
      useCase.execute('id-1', { name: 'Acme' }),
    ).resolves.toBeDefined();
    expect(tenantRepository.update).toHaveBeenCalled();
  });
});
