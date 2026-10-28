import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { TENANT_REPOSITORY, type ITenantRepository } from "src/tenants/domain/tenant.repository";
import { PRODUCT_REPOSITORY, type IProductRepository } from "../domain/product.repository";

export interface PublicProduct {
    product_id: string; name: string; description: string | null; price: string; image_url: string | null;
}

@Injectable()
export class GetPublicCatalogUseCase {

    constructor(
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: IProductRepository,
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ){}

    async execute(tenantId: string, storeSlug: string){

        const store = await this.tenantRepository.findActiveStoreBySlug(tenantId, storeSlug);
        if (!store){
            throw new NotFoundException({ statusCode: 404, message: 'Store not found', error: 'Not Found', code: 'STORE_NOT_FOUND' });
        }

        const lines = await this.productRepository.findCatalog(tenantId, store.store_id);

        // Lines arrive ordered by category then product, so a Map keeps both orders.
        const categories = new Map<string, { category_id: string; name: string; products: PublicProduct[] }>();
        for (const line of lines){
            let category = categories.get(line.category_id);
            if (!category){
                category = { category_id: line.category_id, name: line.category_name, products: [] };
                categories.set(line.category_id, category);
            }
            category.products.push({
                product_id: line.product_id,
                name: line.name,
                description: line.description,
                price: line.price,
                image_url: line.image_path ? `/media/${line.image_path}` : null,
            });
        }

        return { store, categories: [...categories.values()] };
    }
}
