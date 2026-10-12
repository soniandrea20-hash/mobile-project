import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UpdateTenantCommand } from "./commands/update.command";
import { TENANT_REPOSITORY, type ITenantRepository } from "../domain/tenant.repository";
import { Tenant } from "../domain/tenant.entity";

@Injectable()
export class GetAllTenantsUseCase {

    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ){}

    async execute(){
        
        const tenants = await this.tenantRepository.getAll();
        return tenants;
    }
}