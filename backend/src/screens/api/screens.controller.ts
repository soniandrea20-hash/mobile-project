import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { RequirePermissions } from 'src/roles/api/require-permissions.decorator';
import { CurrentTenant } from 'src/tenants/api/current-tenant.decorator';
import { Tenant } from 'src/tenants/domain/tenant.entity';
import { CreateScreenUseCase } from '../application/create-screen.use-case';
import { ListScreensUseCase } from '../application/list-screens.use-case';
import { UpdateScreenUseCase } from '../application/update-screen.use-case';
import { CreateScreenDto, ListScreensQueryDto, UpdateScreenDto } from './dto/screen.dto';

@Controller('screens')
export class ScreensController {
  constructor(
    private readonly listScreens: ListScreensUseCase,
    private readonly createScreen: CreateScreenUseCase,
    private readonly updateScreen: UpdateScreenUseCase,
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

  @Patch(':screenId')
  @RequirePermissions('screens:update')
  update(
    @CurrentTenant() tenant: Tenant,
    @Param('screenId', ParseUUIDPipe) screenId: string,
    @Body() dto: UpdateScreenDto,
  ) {
    return this.updateScreen.execute(tenant, screenId, dto);
  }
}
