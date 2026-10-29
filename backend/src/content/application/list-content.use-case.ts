import { Inject, Injectable } from "@nestjs/common";
import { TENANT_REPOSITORY, type ITenantRepository } from "src/tenants/domain/tenant.repository";
import { Tenant } from "src/tenants/domain/tenant.entity";
import { storeNotFound } from "../domain/content.errors";
import { CONTENT_REPOSITORY, toContentResponse, type IContentRepository } from "../domain/content.repository";

@Injectable()
export class ListContentUseCase {

    constructor(
        @Inject(CONTENT_REPOSITORY)
        private readonly contentRepository: IContentRepository,
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ){}

    async execute(tenant: Tenant, storeId: string){
        if (!(await this.tenantRepository.isStoreOfTenant(tenant.tenant_id, storeId))) throw storeNotFound();

        const rows = await this.contentRepository.listByStore(tenant.tenant_id, storeId);
        return rows.map(toContentResponse);
    }
}
