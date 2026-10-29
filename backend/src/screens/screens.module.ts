import { Module } from '@nestjs/common';
import { ContentModule } from 'src/content/content.module';
import { TenantsModule } from 'src/tenants/tenants.module';
import { ScreensController } from './api/screens.controller';
import { PlayerController } from './api/player.controller';
import { GetPlaylistUseCase } from './application/get-playlist.use-case';
import { CreateScreenUseCase } from './application/create-screen.use-case';
import { ListScreensUseCase } from './application/list-screens.use-case';
import { UpdateScreenUseCase } from './application/update-screen.use-case';
import { SCREEN_REPOSITORY } from './domain/screen.repository';
import { PostgreScreenRepository } from './infraestructure/postgre-screen.repository';

@Module({
  imports: [TenantsModule, ContentModule],
  controllers: [ScreensController, PlayerController],
  providers: [
    { provide: SCREEN_REPOSITORY, useClass: PostgreScreenRepository },
    CreateScreenUseCase,
    ListScreensUseCase,
    UpdateScreenUseCase,
    GetPlaylistUseCase,
  ],
})
export class ScreensModule {}
