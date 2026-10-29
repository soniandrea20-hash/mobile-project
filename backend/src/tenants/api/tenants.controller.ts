import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { RequirePermissions } from 'src/roles/api/require-permissions.decorator';
import { CreateTenantUseCase } from '../application/create.use-case';
import { GetAllTenantsUseCase } from '../application/get-all.use-case';
import { UpdateTenantUseCase } from '../application/update.use-case';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly getAllTenants: GetAllTenantsUseCase,
    private readonly createTenant: CreateTenantUseCase,
    private readonly updateTenant: UpdateTenantUseCase,
  ) {}

  @Get()
  @RequirePermissions('tenants:read')
  list() {
    return this.getAllTenants.execute();
  }

  @Post()
  @RequirePermissions('tenants:create')
  create(@Body() dto: CreateTenantDto) {
    return this.createTenant.execute(dto);
  }

  @Patch(':tenantId')
  @RequirePermissions('tenants:update')
  update(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() dto: UpdateTenantDto) {
    return this.updateTenant.execute(tenantId, dto);
  }
}
