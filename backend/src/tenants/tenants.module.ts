import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TENANT_REPOSITORY } from './domain/tenant.repository';
import { PostgreTenantRepository } from './infraestructure/postgre-tenant.repository';
import { TenantOrmEntity } from './infraestructure/tenant.orm-entity';

@Module({
  imports: [TypeOrmModule.forFeature([TenantOrmEntity])],
  controllers: [],
  providers: [
    {
        provide: TENANT_REPOSITORY,
        useClass: PostgreTenantRepository
    }
  ],
  exports:[TENANT_REPOSITORY]
})
export class TenantsModule {}
