import { Inject, Injectable } from "@nestjs/common";
import { ROLE_REPOSITORY, type IRoleRepository } from "src/roles/domain/role.repository";
import { STORE_REPOSITORY, type IStoreRepository } from "src/stores/domain/store.repository";
import { Tenant } from "src/tenants/domain/tenant.entity";
import { USER_REPOSITORY, type IUserRepository } from "src/users/domain/user.repository";

@Injectable()
export class GetMeUseCase {

    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: IRoleRepository,
        @Inject(STORE_REPOSITORY)
        private readonly storeRepository: IStoreRepository,
    ){}

    async execute(tenant: Tenant, userId: string){
        const [user, stores, permissions] = await Promise.all([
            this.userRepository.getById(userId),
            this.storeRepository.list(tenant.tenant_id),
            this.roleRepository.getPermissionCodesByUserId(userId),
        ]);

        return {
            user: { user_id: user!.user_id, email: user!.email, first_name: user!.first_name, last_name: user!.last_name },
            tenant: { tenant_id: tenant.tenant_id, name: tenant.name, slug: tenant.slug },
            stores: stores.filter((s) => s.is_active).map(({ store_id, name, slug }) => ({ store_id, name, slug })),
            permissions,
        };
    }
}
