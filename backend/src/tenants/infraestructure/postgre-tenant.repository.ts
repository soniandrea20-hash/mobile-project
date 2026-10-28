import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CreateTenantData, ITenantRepository, ResponseTenantData, ResponseUpdateTenant } from "../domain/tenant.repository";
import { Tenant } from "../domain/tenant.entity";
import { Repository } from "typeorm";
import { TenantOrmEntity } from "./tenant.orm-entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class PostgreTenantRepository implements ITenantRepository{

    constructor(
        @InjectRepository(TenantOrmEntity)
        private readonly tenantDb: Repository<TenantOrmEntity>
    ){}
    async create(tenant: CreateTenantData): Promise<ResponseTenantData> {
        const entity = this.tenantDb.create(tenant);
        const saved = await this.tenantDb.save(entity);
        return {
            tenant_id: saved.tenant_id,
            name: saved.name,
            slug: saved.slug,
            is_active: saved.is_active
        }
    }
    async update(tenantId:string, tenant: ResponseUpdateTenant): Promise<ResponseTenantData> {

        await this.tenantDb.update(tenantId, tenant);

        const saved = await this.tenantDb.findOne({
            where: {
                tenant_id: tenantId
            }
        });
        if (!saved) {
            throw new NotFoundException(`El tenant con ID ${tenantId} no existe`);
        }
        
        return {
            tenant_id: saved.tenant_id,
            name: saved.name,
            slug: saved.slug,
            is_active: saved.is_active
        }
    }
    async delete(id: string): Promise<boolean> {
        const result = await this.tenantDb.update(id, { is_active: false });
        if (result.affected === 0) {
            return false;
        }
        return true;
    }
    async getAll(): Promise<Tenant[]> {
        const entities = this.tenantDb.find({
            where: {
                is_active: true
            }
        });
        return entities;
    }
    async getById(id:string): Promise<Tenant> {
        const entity = await this.tenantDb.findOne({
            where: {
                tenant_id: id,
                is_active: true
            }
        });
        if (!entity) {
            throw new NotFoundException(`El tenant con ID ${id} no existe`);
        }
        return entity;
    }
    async getByName(name:string): Promise<Tenant | null> {
        const tenant = await this.tenantDb.findOne({
            where: {
                name: name.toLocaleLowerCase().trim()
            }
        })
        if (!tenant) {
            return null;
        }
        return {
            tenant_id: tenant.tenant_id,
            name: tenant.name,
            slug: tenant.slug,
            is_active: tenant.is_active
        }
    }
    async findBySlug(slug:string): Promise<Tenant | null> {
        return this.tenantDb.findOne({ where: { slug } });
    }
    async isActiveMember(tenantId: string, userId: string): Promise<boolean> {
        const rows = await this.tenantDb.manager.query(
            'SELECT 1 FROM users_tenants WHERE tenant_id = $1 AND user_id = $2 AND is_active = true LIMIT 1',
            [tenantId, userId],
        );
        return rows.length > 0;
    }
    async isStoreOfTenant(tenantId: string, storeId: string): Promise<boolean> {
        const rows = await this.tenantDb.manager.query(
            'SELECT 1 FROM stores WHERE store_id = $1 AND tenant_id = $2 LIMIT 1',
            [storeId, tenantId],
        );
        return rows.length > 0;
    }
    async findActiveStoreBySlug(tenantId: string, slug: string): Promise<{ store_id: string; name: string; slug: string } | null> {
        const rows = await this.tenantDb.manager.query(
            "SELECT store_id, name, slug FROM stores WHERE tenant_id = $1 AND slug = $2 AND is_active = true LIMIT 1",
            [tenantId, slug],
        );
        return rows[0] ?? null;
    }

}