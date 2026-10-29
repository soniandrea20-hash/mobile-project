import { Inject, Injectable } from "@nestjs/common";
import { Tenant } from "src/tenants/domain/tenant.entity";
import { contentNotFound, durationNotAllowed, emptyUpdate } from "../domain/content.errors";
import { CONTENT_REPOSITORY, toContentResponse, type ContentPatch, type IContentRepository } from "../domain/content.repository";

@Injectable()
export class UpdateContentUseCase {

    constructor(
        @Inject(CONTENT_REPOSITORY)
        private readonly contentRepository: IContentRepository,
    ){}

    async execute(tenant: Tenant, contentId: string, input: ContentPatch){
        const patch: ContentPatch = {};
        if (input.duration_seconds !== undefined) patch.duration_seconds = input.duration_seconds;
        if (input.is_visible !== undefined) patch.is_visible = input.is_visible;
        if (Object.keys(patch).length === 0) throw emptyUpdate();

        const current = await this.contentRepository.findOne(tenant.tenant_id, contentId);
        if (!current) throw contentNotFound();
        if (patch.duration_seconds !== undefined && current.type === 'video') throw durationNotAllowed();

        const row = await this.contentRepository.update(tenant.tenant_id, contentId, patch);
        if (!row) throw contentNotFound();
        return toContentResponse(row);
    }
}
