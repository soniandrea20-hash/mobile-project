import { Module } from '@nestjs/common';
import { TenantsModule } from 'src/tenants/tenants.module';
import { ScreensController } from './api/screens.controller';
import { CreateScreenUseCase } from './application/create-screen.use-case';
import { ListScreensUseCase } from './application/list-screens.use-case';
import { SCREEN_REPOSITORY } from './domain/screen.repository';
import { PostgreScreenRepository } from './infraestructure/postgre-screen.repository';

@Module({
  imports: [TenantsModule],
  controllers: [ScreensController],
  providers: [
    { provide: SCREEN_REPOSITORY, useClass: PostgreScreenRepository },
    CreateScreenUseCase,
    ListScreensUseCase,
  ],
})
export class ScreensModule {}
