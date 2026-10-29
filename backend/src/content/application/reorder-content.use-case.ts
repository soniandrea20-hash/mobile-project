import { Inject, Injectable } from "@nestjs/common";
import { TENANT_REPOSITORY, type ITenantRepository } from "src/tenants/domain/tenant.repository";
import { Tenant } from "src/tenants/domain/tenant.entity";
import { contentListMismatch, storeNotFound } from "../domain/content.errors";
import { CONTENT_REPOSITORY, toContentResponse, type IContentRepository } from "../domain/content.repository";

@Injectable()
export class ReorderContentUseCase {

    constructor(
        @Inject(CONTENT_REPOSITORY)
        private readonly contentRepository: IContentRepository,
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ){}

    // The DTO already rejects empty and duplicated lists; here the list must match the store's items exactly.
    async execute(tenant: Tenant, storeId: string, contentIds: string[]){
        if (!(await this.tenantRepository.isStoreOfTenant(tenant.tenant_id, storeId))) throw storeNotFound();

        const current = await this.contentRepository.listByStore(tenant.tenant_id, storeId);
        const known = new Set(current.map((row) => row.content_id));
        if (known.size !== contentIds.length || !contentIds.every((id) => known.has(id))) throw contentListMismatch();

        const rows = await this.contentRepository.reorder(tenant.tenant_id, storeId, contentIds);
        return rows.map(toContentResponse);
    }
}
