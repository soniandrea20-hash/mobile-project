import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { TENANT_REPOSITORY, type ITenantRepository } from "src/tenants/domain/tenant.repository";
import { PRODUCT_REPOSITORY, type IProductRepository, type ProductFilters } from "../domain/product.repository";
import { toProductResponse } from "../domain/product.entity";

@Injectable()
export class ListProductsUseCase {

    constructor(
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: IProductRepository,
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ){}

    async execute(tenantId: string, filters: ProductFilters){

        if (!(await this.tenantRepository.isStoreOfTenant(tenantId, filters.store_id))){
            throw new NotFoundException({ statusCode: 404, message: 'Store not found', error: 'Not Found', code: 'STORE_NOT_FOUND' });
        }

        const products = await this.productRepository.findAll(tenantId, filters);
        return products.map(toProductResponse);
    }
}
