import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UpdateTenantCommand } from "./commands/update.command";
import { TENANT_REPOSITORY, type ITenantRepository } from "../domain/tenant.repository";
import { Tenant } from "../domain/tenant.entity";

@Injectable()
export class UpdateTenantUseCase {

    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ){}

    async execute(tenantId: string, dto: UpdateTenantCommand){
        
        let tenantUpdated: Tenant | null = null;
        const nameExists = await this.tenantRepository.getByName(dto.name.toLocaleLowerCase().trim());

        /* Si el nombre ya existe y es diferente al tenant que se está actualizando */
        if (nameExists && nameExists.tenant_id !== tenantId){
            throw new ConflictException(`El nombre de tenant ${dto.name} ya se encuentra registrado`);
        }
        
        /* Chequeamos que exista el tenant */
        const tenantExists = await this.tenantRepository.getById(tenantId);
        if (!tenantExists){
            throw new NotFoundException(`El tenant con ID ${tenantId} no existe`);
        }
        
        tenantUpdated = await this.tenantRepository.update(tenantId, {
            name: dto.name.trim()
        })
        return tenantUpdated;
    }
}