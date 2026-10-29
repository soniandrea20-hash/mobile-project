import { Inject, Injectable } from "@nestjs/common";
import { Tenant } from "src/tenants/domain/tenant.entity";
import { withSelfOrderUrl } from "../domain/store-url";
import { storeNotFound } from "../domain/store.errors";
import { STORE_REPOSITORY, type IStoreRepository } from "../domain/store.repository";

@Injectable()
export class GetStoreUseCase {

    constructor(
        @Inject(STORE_REPOSITORY)
        private readonly storeRepository: IStoreRepository,
    ){}

    async execute(tenant: Tenant, storeId: string){
        const store = await this.storeRepository.findById(tenant.tenant_id, storeId);
        if (!store) throw storeNotFound();

        return withSelfOrderUrl(tenant.slug, store);
    }
}
