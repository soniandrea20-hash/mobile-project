import { Tenant } from "./tenant.entity";

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY')

export interface CreateTenantData {
  name: string;
}

export interface ResponseTenantData {
    tenant_id:string;
    name: string;
    is_active: boolean;
}

export interface ResponseUpdateTenant {
    tenant_id?:string;
    name?: string;
    is_active?: boolean;
}

export interface ITenantRepository{
    create(tenant:CreateTenantData):Promise<ResponseTenantData>;
    update(tenantId: string, tenant: ResponseUpdateTenant):Promise<ResponseTenantData>;
    delete(id:string):boolean;
    getAll():Promise<Tenant[]>;
    getById(id:string):Promise<Tenant | null>;
    getByName(name:string):Promise<Tenant | null>;
}