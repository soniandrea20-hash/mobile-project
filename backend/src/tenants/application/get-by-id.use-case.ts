import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UpdateTenantCommand } from "./commands/update.command";
import { TENANT_REPOSITORY, type ITenantRepository } from "../domain/tenant.repository";
import { Tenant } from "../domain/tenant.entity";

@Injectable()
export class GetTenantByIdUseCase {

    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ){}

    async execute(tenantId: string){
        
        const tenant = await this.tenantRepository.getById(tenantId);

        if (!tenant){
            throw new NotFoundException(`El tenant con ID ${tenantId} no existe`);
        }

        return tenant;
    }
}