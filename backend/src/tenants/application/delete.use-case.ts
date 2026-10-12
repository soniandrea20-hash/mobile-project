import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UpdateTenantCommand } from "./commands/update.command";
import { TENANT_REPOSITORY, type ITenantRepository } from "../domain/tenant.repository";
import { Tenant } from "../domain/tenant.entity";

@Injectable()
export class DeleteTenantUseCase {

    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ){}

    async execute(tenantId: string){

        const tenantExists = await this.tenantRepository.getById(tenantId);

        if (!tenantExists){
            throw new NotFoundException(`El tenant con ID ${tenantId} no existe`);
        }

        if (!tenantExists.is_active){
            throw new BadRequestException(`El tenant con ID ${tenantId} ya se encuentra eliminado`);
        }
        
        const tenant = await this.tenantRepository.update(tenantId, { is_active: false });

        return tenant;
    }
}