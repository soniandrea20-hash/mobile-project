import { createHash } from "crypto";
import { Inject, Injectable } from "@nestjs/common";
import { CONTENT_REPOSITORY, type IContentRepository } from "src/content/domain/content.repository";
import { Tenant } from "src/tenants/domain/tenant.entity";
import { webOrigin } from "src/tenants/domain/web-origin";
import { screenNotFound } from "../domain/screen.errors";
import { SCREEN_REPOSITORY, type IScreenRepository } from "../domain/screen.repository";

@Injectable()
export class GetPlaylistUseCase {

    constructor(
        @Inject(SCREEN_REPOSITORY)
        private readonly screenRepository: IScreenRepository,
        @Inject(CONTENT_REPOSITORY)
        private readonly contentRepository: IContentRepository,
    ){}

    async execute(tenant: Tenant, token: string){
        const screen = await this.screenRepository.findPlayerScreen(tenant.tenant_id, token);
        if (!screen) throw screenNotFound();

        const content = await this.contentRepository.listByStore(tenant.tenant_id, screen.store_id);
        // Key order matters: the version hashes this JSON as is.
        const body = {
            poll_interval_seconds: 30,
            store: { name: screen.store_name, slug: screen.store_slug },
            qr_url: `${webOrigin(tenant.slug)}/${screen.store_slug}?src=${screen.screen_id}`,
            items: content
                .filter((c) => c.is_visible)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((c) => ({ content_id: c.content_id, type: c.type, url: `/media/${c.file_path}`, duration_seconds: c.duration_seconds })),
        };
        const version = createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 16);

        return { version, ...body };
    }
}
