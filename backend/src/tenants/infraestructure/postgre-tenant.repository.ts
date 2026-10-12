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
            is_active: saved.is_active
        }
    }
    delete(id: string): boolean {
        throw new Error("Method not implemented.");
    }
    getAll(): Promise<Tenant[]> {
        throw new Error("Method not implemented.");
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
            is_active: tenant.is_active
        }
    }
    
}