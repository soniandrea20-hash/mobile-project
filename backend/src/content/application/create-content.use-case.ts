import { Inject, Injectable } from "@nestjs/common";
import { TENANT_REPOSITORY, type ITenantRepository } from "src/tenants/domain/tenant.repository";
import { Tenant } from "src/tenants/domain/tenant.entity";
import { detectMedia, VIDEO_MAX_SECONDS } from "../domain/content-media";
import {
    durationNotAllowed, mediaTooLarge, mediaUnreadable, storeNotFound, unsupportedMediaType, videoTooLong,
} from "../domain/content.errors";
import { CONTENT_REPOSITORY, toContentResponse, type IContentRepository } from "../domain/content.repository";
import { CONTENT_STORAGE, VIDEO_PROBE, type IContentStorage, type IVideoProbe } from "./ports/content-ports";

export interface CreateContentInput {
    store_id: string;
    file: Buffer;
    original_name: string;
    duration_seconds?: number;
}

@Injectable()
export class CreateContentUseCase {

    constructor(
        @Inject(CONTENT_REPOSITORY)
        private readonly contentRepository: IContentRepository,
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
        @Inject(CONTENT_STORAGE)
        private readonly storage: IContentStorage,
        @Inject(VIDEO_PROBE)
        private readonly videoProbe: IVideoProbe,
    ){}

    async execute(tenant: Tenant, input: CreateContentInput){
        const tenantId = tenant.tenant_id;
        if (!(await this.tenantRepository.isStoreOfTenant(tenantId, input.store_id))) throw storeNotFound();

        const media = detectMedia(input.file);
        if (!media) throw unsupportedMediaType();
        if (input.file.length > media.maxBytes) throw mediaTooLarge(media.type === 'image' ? '5 MB' : '50 MB');
        if (media.type === 'video' && input.duration_seconds !== undefined) throw durationNotAllowed();

        const filePath = await this.storage.save(tenantId, input.file, media.ext);
        try {
            const duration = media.type === 'video'
                ? await this.measureVideo(filePath)
                : input.duration_seconds ?? (Number(process.env.DEFAULT_IMAGE_SECONDS) || 10);

            const row = await this.contentRepository.create(tenantId, {
                store_id: input.store_id,
                type: media.type,
                file_path: filePath,
                original_name: input.original_name.slice(0, 255),
                mime_type: media.mime,
                size_bytes: input.file.length,
                duration_seconds: duration,
            });
            return toContentResponse(row);
        } catch (error) {
            await this.storage.remove(filePath);
            throw error;
        }
    }

    private async measureVideo(filePath: string){
        let seconds: number;
        try {
            seconds = await this.videoProbe.durationSeconds(filePath);
        } catch {
            throw mediaUnreadable();
        }
        if (!(seconds >= 1)) throw mediaUnreadable();
        if (seconds > VIDEO_MAX_SECONDS) throw videoTooLong();
        return seconds;
    }
}
