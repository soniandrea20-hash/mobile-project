import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { TENANT_REPOSITORY, type ITenantRepository } from "src/tenants/domain/tenant.repository";
import { CATEGORY_REPOSITORY, type ICategoryRepository } from "../domain/category.repository";

@Injectable()
export class ListCategoriesUseCase {

    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly categoryRepository: ICategoryRepository,
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ){}

    async execute(tenantId: string, storeId: string){

        if (!(await this.tenantRepository.isStoreOfTenant(tenantId, storeId))){
            throw new NotFoundException({ statusCode: 404, message: 'Store not found', error: 'Not Found', code: 'STORE_NOT_FOUND' });
        }

        return this.categoryRepository.findAll(tenantId, storeId);
    }
}
