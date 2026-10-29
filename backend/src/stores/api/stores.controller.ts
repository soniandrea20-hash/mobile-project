import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { RequirePermissions } from 'src/roles/api/require-permissions.decorator';
import { CurrentTenant } from 'src/tenants/api/current-tenant.decorator';
import { Tenant } from 'src/tenants/domain/tenant.entity';
import { GetStoreUseCase } from '../application/get-store.use-case';
import { ListStoresUseCase } from '../application/list-stores.use-case';
import { UpdateStoreUseCase } from '../application/update-store.use-case';
import { UpdateStoreDto } from './dto/store.dto';

@Controller('stores')
export class StoresController {
  constructor(
    private readonly listStores: ListStoresUseCase,
    private readonly getStore: GetStoreUseCase,
    private readonly updateStore: UpdateStoreUseCase,
  ) {}

  @Get()
  @RequirePermissions('stores:read')
  list(@CurrentTenant() tenant: Tenant) {
    return this.listStores.execute(tenant);
  }

  @Get(':storeId')
  @RequirePermissions('stores:read')
  get(@CurrentTenant() tenant: Tenant, @Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.getStore.execute(tenant, storeId);
  }

  @Patch(':storeId')
  @RequirePermissions('stores:update')
  update(
    @CurrentTenant() tenant: Tenant,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.updateStore.execute(tenant, storeId, dto);
  }
}
