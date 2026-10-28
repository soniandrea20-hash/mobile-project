import { Inject, Injectable } from "@nestjs/common";
import { PRODUCT_REPOSITORY, type IProductRepository } from "../domain/product.repository";
import { toProductResponse } from "../domain/product.entity";
import { productNotFound } from "../domain/product.errors";

@Injectable()
export class GetProductUseCase {

    constructor(
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: IProductRepository,
    ){}

    async execute(tenantId: string, productId: string){

        const product = await this.productRepository.findOne(tenantId, productId);
        if (!product){
            throw productNotFound();
        }

        return toProductResponse(product);
    }
}
