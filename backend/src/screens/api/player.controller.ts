import { Controller, Get, Headers, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from 'src/auth/api/public.decorator';
import { CurrentTenant } from 'src/tenants/api/current-tenant.decorator';
import { Tenant } from 'src/tenants/domain/tenant.entity';
import { GetPlaylistUseCase } from '../application/get-playlist.use-case';

@Controller('player')
export class PlayerController {
  constructor(private readonly getPlaylist: GetPlaylistUseCase) {}

  @Public()
  @Get(':token/playlist')
  async playlist(
    @CurrentTenant() tenant: Tenant,
    @Param('token') token: string,
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const playlist = await this.getPlaylist.execute(tenant, token);
    const etag = `"${playlist.version}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'no-cache');
    if (ifNoneMatch === etag) {
      res.status(304);
      return;
    }
    return playlist;
  }
}
