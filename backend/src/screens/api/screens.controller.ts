import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RequirePermissions } from 'src/roles/api/require-permissions.decorator';
import { CurrentTenant } from 'src/tenants/api/current-tenant.decorator';
import { Tenant } from 'src/tenants/domain/tenant.entity';
import { CreateScreenUseCase } from '../application/create-screen.use-case';
import { ListScreensUseCase } from '../application/list-screens.use-case';
import { CreateScreenDto, ListScreensQueryDto } from './dto/screen.dto';

@Controller('screens')
export class ScreensController {
  constructor(
    private readonly listScreens: ListScreensUseCase,
    private readonly createScreen: CreateScreenUseCase,
  ) {}

  @Get()
  @RequirePermissions('screens:read')
  list(@CurrentTenant() tenant: Tenant, @Query() query: ListScreensQueryDto) {
    return this.listScreens.execute(tenant, query.store_id);
  }

  @Post()
  @RequirePermissions('screens:create')
  create(@CurrentTenant() tenant: Tenant, @Body() dto: CreateScreenDto) {
    return this.createScreen.execute(tenant, dto);
  }
}
