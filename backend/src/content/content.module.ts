import { Module } from '@nestjs/common';
import { TenantsModule } from 'src/tenants/tenants.module';
import { ContentController } from './api/content.controller';
import { CreateContentUseCase } from './application/create-content.use-case';
import { DeleteContentUseCase } from './application/delete-content.use-case';
import { ListContentUseCase } from './application/list-content.use-case';
import { CONTENT_STORAGE, VIDEO_PROBE } from './application/ports/content-ports';
import { ReorderContentUseCase } from './application/reorder-content.use-case';
import { UpdateContentUseCase } from './application/update-content.use-case';
import { CONTENT_REPOSITORY } from './domain/content.repository';
import { FfprobeVideoProbe } from './infraestructure/ffprobe-video-probe';
import { LocalContentStorage } from './infraestructure/local-content-storage';
import { PostgreContentRepository } from './infraestructure/postgre-content.repository';

@Module({
  imports: [TenantsModule],
  controllers: [ContentController],
  providers: [
    { provide: CONTENT_REPOSITORY, useClass: PostgreContentRepository },
    { provide: CONTENT_STORAGE, useClass: LocalContentStorage },
    { provide: VIDEO_PROBE, useClass: FfprobeVideoProbe },
    ListContentUseCase,
    CreateContentUseCase,
    UpdateContentUseCase,
    ReorderContentUseCase,
    DeleteContentUseCase,
  ],
  exports: [CONTENT_REPOSITORY],
})
export class ContentModule {}
