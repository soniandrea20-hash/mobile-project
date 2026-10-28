import { NotFoundException } from '@nestjs/common';
import { TenantMiddleware } from 'src/tenants/api/tenant.middleware';

describe('TenantMiddleware', () => {
  const repository = { findBySlug: jest.fn() };
  const middleware = new TenantMiddleware(repository as any);
  const tenant = { tenant_id: 't1', slug: 'local1', name: 'Local 1', is_active: true };

  const run = async (host: string | undefined, headers: Record<string, string> = {}) => {
    const req: any = { headers: { host, ...headers } };
    const next = jest.fn();
    await middleware.use(req, {} as any, next);
    return { req, next };
  };

  beforeEach(() => jest.clearAllMocks());

  it('resolves the tenant from the Host subdomain', async () => {
    repository.findBySlug.mockResolvedValue(tenant);
    const { req, next } = await run('local1.localhost:3000');
    expect(repository.findBySlug).toHaveBeenCalledWith('local1');
    expect(req.tenant).toBe(tenant);
    expect(next).toHaveBeenCalled();
  });

  it('falls back to X-Tenant-Slug when Host has no slug', async () => {
    repository.findBySlug.mockResolvedValue(tenant);
    const { req } = await run('192.168.0.10:3000', { 'x-tenant-slug': 'local1' });
    expect(repository.findBySlug).toHaveBeenCalledWith('local1');
    expect(req.tenant).toBe(tenant);
  });

  it('ignores X-Tenant-Slug when Host already gives a slug', async () => {
    repository.findBySlug.mockResolvedValue(tenant);
    await run('local1.localhost', { 'x-tenant-slug': 'other' });
    expect(repository.findBySlug).toHaveBeenCalledWith('local1');
  });

  it.each([
    ['no slug anywhere', 'localhost', {}],
    ['reserved slug in Host', 'www.localhost', {}],
    ['invalid slug in header', '10.0.0.1', { 'x-tenant-slug': 'Bad_Slug' }],
    ['reserved slug in header', '10.0.0.1', { 'x-tenant-slug': 'admin' }],
  ])('404 TENANT_NOT_FOUND: %s (no lookup)', async (_n, host, headers) => {
    await expect(run(host, headers)).rejects.toMatchObject({
      response: { code: 'TENANT_NOT_FOUND' },
    });
    expect(repository.findBySlug).not.toHaveBeenCalled();
  });

  it('404 TENANT_NOT_FOUND when the tenant does not exist', async () => {
    repository.findBySlug.mockResolvedValue(null);
    await expect(run('nope.localhost')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('404 TENANT_NOT_FOUND when the tenant is inactive', async () => {
    repository.findBySlug.mockResolvedValue({ ...tenant, is_active: false });
    await expect(run('local1.localhost')).rejects.toMatchObject({
      response: { code: 'TENANT_NOT_FOUND' },
    });
  });
});
