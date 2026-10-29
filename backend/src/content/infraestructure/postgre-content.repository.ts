import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { ContentPatch, ContentRow, IContentRepository, NewContent } from "../domain/content.repository";

const COLUMNS = `content_id, store_id, type, file_path, original_name, mime_type, size_bytes,
    duration_seconds, sort_order, is_visible, created_at, updated_at`;

@Injectable()
export class PostgreContentRepository implements IContentRepository {

    constructor(@InjectDataSource() private readonly dataSource: DataSource){}

    listByStore(tenantId: string, storeId: string): Promise<ContentRow[]> {
        return this.dataSource.query(
            `SELECT ${COLUMNS} FROM content_items WHERE tenant_id = $1 AND store_id = $2 ORDER BY sort_order`,
            [tenantId, storeId],
        );
    }

    async findOne(tenantId: string, contentId: string): Promise<ContentRow | null> {
        const rows = await this.dataSource.query(
            `SELECT ${COLUMNS} FROM content_items WHERE tenant_id = $1 AND content_id = $2`,
            [tenantId, contentId],
        );
        return rows[0] ?? null;
    }

    async create(tenantId: string, data: NewContent): Promise<ContentRow> {
        const rows = await this.dataSource.query(
            `INSERT INTO content_items
                (tenant_id, store_id, type, file_path, original_name, mime_type, size_bytes, duration_seconds, sort_order)
             SELECT $1::uuid, $2::uuid, $3::varchar, $4::varchar, $5::varchar, $6::varchar, $7::bigint, $8::smallint,
                    COALESCE(MAX(sort_order), 0) + 1
             FROM content_items WHERE tenant_id = $1 AND store_id = $2
             RETURNING ${COLUMNS}`,
            [tenantId, data.store_id, data.type, data.file_path, data.original_name, data.mime_type, data.size_bytes, data.duration_seconds],
        );
        return rows[0];
    }

    async update(tenantId: string, contentId: string, patch: ContentPatch): Promise<ContentRow | null> {
        const rows = await this.dataSource.query(
            `UPDATE content_items
             SET duration_seconds = COALESCE($3, duration_seconds), is_visible = COALESCE($4, is_visible), updated_at = now()
             WHERE tenant_id = $1 AND content_id = $2
             RETURNING ${COLUMNS}`,
            [tenantId, contentId, patch.duration_seconds ?? null, patch.is_visible ?? null],
        );
        return rows[0] ?? null;
    }

    reorder(tenantId: string, storeId: string, contentIds: string[]): Promise<ContentRow[]> {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(
                `UPDATE content_items c SET sort_order = v.pos, updated_at = now()
                 FROM unnest($3::uuid[]) WITH ORDINALITY AS v(id, pos)
                 WHERE c.content_id = v.id AND c.tenant_id = $1 AND c.store_id = $2`,
                [tenantId, storeId, contentIds],
            );
            return manager.query(
                `SELECT ${COLUMNS} FROM content_items WHERE tenant_id = $1 AND store_id = $2 ORDER BY sort_order`,
                [tenantId, storeId],
            );
        });
    }

    delete(tenantId: string, contentId: string): Promise<ContentRow | null> {
        return this.dataSource.transaction(async (manager) => {
            const rows: ContentRow[] = await manager.query(
                `DELETE FROM content_items WHERE tenant_id = $1 AND content_id = $2 RETURNING ${COLUMNS}`,
                [tenantId, contentId],
            );
            if (!rows[0]) return null;

            await manager.query(
                `UPDATE content_items c SET sort_order = r.pos, updated_at = now()
                 FROM (SELECT content_id, ROW_NUMBER() OVER (ORDER BY sort_order) AS pos
                       FROM content_items WHERE tenant_id = $1 AND store_id = $2) r
                 WHERE c.content_id = r.content_id AND c.sort_order <> r.pos`,
                [tenantId, rows[0].store_id],
            );
            return rows[0];
        });
    }
}
