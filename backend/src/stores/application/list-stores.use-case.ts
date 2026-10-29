import { Inject, Injectable } from "@nestjs/common";
import { Tenant } from "src/tenants/domain/tenant.entity";
import { withSelfOrderUrl } from "../domain/store-url";
import { STORE_REPOSITORY, type IStoreRepository } from "../domain/store.repository";

@Injectable()
export class ListStoresUseCase {

    constructor(
        @Inject(STORE_REPOSITORY)
        private readonly storeRepository: IStoreRepository,
    ){}

    async execute(tenant: Tenant){
        const stores = await this.storeRepository.list(tenant.tenant_id);
        return stores.map((store) => withSelfOrderUrl(tenant.slug, store));
    }
}
