import { Inject, Injectable } from "@nestjs/common";
import { Tenant } from "src/tenants/domain/tenant.entity";
import { contentNotFound } from "../domain/content.errors";
import { CONTENT_REPOSITORY, type IContentRepository } from "../domain/content.repository";
import { CONTENT_STORAGE, type IContentStorage } from "./ports/content-ports";

@Injectable()
export class DeleteContentUseCase {

    constructor(
        @Inject(CONTENT_REPOSITORY)
        private readonly contentRepository: IContentRepository,
        @Inject(CONTENT_STORAGE)
        private readonly storage: IContentStorage,
    ){}

    async execute(tenant: Tenant, contentId: string){
        const row = await this.contentRepository.delete(tenant.tenant_id, contentId);
        if (!row) throw contentNotFound();

        await this.storage.remove(row.file_path);
    }
}
