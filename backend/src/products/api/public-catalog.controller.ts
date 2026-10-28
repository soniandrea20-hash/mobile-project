import { Controller, Get, Param } from '@nestjs/common';
import { Public } from 'src/auth/api/public.decorator';
import { CurrentTenant } from 'src/tenants/api/current-tenant.decorator';
import { Tenant } from 'src/tenants/domain/tenant.entity';
import { GetPublicCatalogUseCase } from '../application/get-public-catalog.use-case';

@Controller('public/stores')
export class PublicCatalogController {
  constructor(private readonly getPublicCatalog: GetPublicCatalogUseCase) {}

  @Public()
  @Get(':storeSlug/catalog')
  catalog(@CurrentTenant() tenant: Tenant, @Param('storeSlug') storeSlug: string) {
    return this.getPublicCatalog.execute(tenant.tenant_id, storeSlug);
  }
}
