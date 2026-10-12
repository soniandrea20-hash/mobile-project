import { BadRequestException, ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { CreateTenantCommand } from "./commands/create.command";
import { TENANT_REPOSITORY, type ITenantRepository } from "../domain/tenant.repository";

@Injectable()
export class CreateTenantUseCase {

    constructor(
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ){}

    async execute(dto: CreateTenantCommand){
        const tenantExists = await this.tenantRepository.getByName(dto.name.toLocaleLowerCase().trim());
        if (tenantExists !== null){
            throw new ConflictException(`El nombre de tenant ${dto.name} ya se encuentra registrado`);
        }

        const tenantCreated = await this.tenantRepository.create({
            name: dto.name.trim()
        })

        return tenantCreated;
    }
}