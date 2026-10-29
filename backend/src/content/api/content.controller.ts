import {
  BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put, Query,
  UploadedFile, UseFilters, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaTooLargeFilter } from 'src/products/api/media-too-large.filter';
import { RequirePermissions } from 'src/roles/api/require-permissions.decorator';
import { CurrentTenant } from 'src/tenants/api/current-tenant.decorator';
import { Tenant } from 'src/tenants/domain/tenant.entity';
import { CreateContentUseCase } from '../application/create-content.use-case';
import { DeleteContentUseCase } from '../application/delete-content.use-case';
import { ListContentUseCase } from '../application/list-content.use-case';
import { ReorderContentUseCase } from '../application/reorder-content.use-case';
import { UpdateContentUseCase } from '../application/update-content.use-case';
import { VIDEO_MAX_BYTES } from '../domain/content-media';
import { CreateContentDto, ListContentQueryDto, ReorderContentDto, UpdateContentDto } from './dto/content.dto';

// Multer cap is the video limit; the use case enforces the lower image limit.
const CONTENT_UPLOAD_OPTIONS = { limits: { fileSize: VIDEO_MAX_BYTES, files: 1 } };

@Controller('content')
export class ContentController {
  constructor(
    private readonly listContent: ListContentUseCase,
    private readonly createContent: CreateContentUseCase,
    private readonly updateContent: UpdateContentUseCase,
    private readonly reorderContent: ReorderContentUseCase,
    private readonly deleteContent: DeleteContentUseCase,
  ) {}

  @Get()
  @RequirePermissions('content:read')
  list(@CurrentTenant() tenant: Tenant, @Query() query: ListContentQueryDto) {
    return this.listContent.execute(tenant, query.store_id);
  }

  @Post()
  @RequirePermissions('content:create')
  @UseInterceptors(FileInterceptor('file', CONTENT_UPLOAD_OPTIONS))
  @UseFilters(MediaTooLargeFilter)
  create(
    @CurrentTenant() tenant: Tenant,
    @Body() dto: CreateContentDto,
    @UploadedFile() file?: { buffer: Buffer; originalname: string },
  ) {
    if (!file) {
      throw new BadRequestException({ statusCode: 400, message: 'file is required', error: 'Bad Request' });
    }
    // Multer decodes the multipart filename as latin1.
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    return this.createContent.execute(tenant, { ...dto, file: file.buffer, original_name: originalName });
  }

  @Put('order')
  @RequirePermissions('content:update')
  reorder(@CurrentTenant() tenant: Tenant, @Body() dto: ReorderContentDto) {
    return this.reorderContent.execute(tenant, dto.store_id, dto.content_ids);
  }

  @Patch(':contentId')
  @RequirePermissions('content:update')
  update(
    @CurrentTenant() tenant: Tenant,
    @Param('contentId', ParseUUIDPipe) contentId: string,
    @Body() dto: UpdateContentDto,
  ) {
    return this.updateContent.execute(tenant, contentId, dto);
  }

  @Delete(':contentId')
  @HttpCode(204)
  @RequirePermissions('content:delete')
  async remove(@CurrentTenant() tenant: Tenant, @Param('contentId', ParseUUIDPipe) contentId: string) {
    await this.deleteContent.execute(tenant, contentId);
  }
}
