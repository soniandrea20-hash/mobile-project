import { Inject, Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TENANT_REPOSITORY, type ITenantRepository } from '../domain/tenant.repository';
import { extractSlugFromHost, isValidSlug } from '../domain/tenant-slug';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async use(req: Request & { tenant?: unknown }, _res: Response, next: NextFunction) {
    const baseDomain = process.env.BASE_DOMAIN ?? 'localhost';
    const header = req.headers['x-tenant-slug'];
    // The header is only read when the Host gives no slug.
    const slug = extractSlugFromHost(req.headers.host, baseDomain) ?? (typeof header === 'string' ? header : null);

    const tenant = slug && isValidSlug(slug) ? await this.tenantRepository.findBySlug(slug) : null;
    if (!tenant?.is_active) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'Tenant not found',
        error: 'Not Found',
        code: 'TENANT_NOT_FOUND',
      });
    }

    req.tenant = tenant;
    next();
  }
}
