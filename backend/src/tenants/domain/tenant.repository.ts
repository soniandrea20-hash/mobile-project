import { Tenant } from "./tenant.entity";

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY')

export interface CreateTenantData {
  name: string;
}

export interface ResponseTenantData {
    tenant_id:string;
    name: string;
    slug: string;
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
    delete(id:string):Promise<boolean>;
    getAll():Promise<Tenant[]>;
    getById(id:string):Promise<Tenant | null>;
    getByName(name:string):Promise<Tenant | null>;
    findBySlug(slug:string):Promise<Tenant | null>;
    isActiveMember(tenantId:string, userId:string):Promise<boolean>;
}