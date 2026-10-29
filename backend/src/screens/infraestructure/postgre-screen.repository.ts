import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { IScreenRepository, NewScreen, PlayerScreen, ScreenPatch, ScreenRow } from "../domain/screen.repository";

const COLUMNS = 'screen_id, store_id, name, token, is_active, created_at, updated_at';

@Injectable()
export class PostgreScreenRepository implements IScreenRepository {

    constructor(@InjectDataSource() private readonly dataSource: DataSource){}

    async create(tenantId: string, screen: NewScreen): Promise<ScreenRow> {
        const rows = await this.dataSource.query(
            `INSERT INTO screens (tenant_id, store_id, name, token) VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
            [tenantId, screen.store_id, screen.name, screen.token],
        );
        return rows[0];
    }

    listByStore(tenantId: string, storeId: string): Promise<ScreenRow[]> {
        return this.dataSource.query(
            `SELECT ${COLUMNS} FROM screens WHERE tenant_id = $1 AND store_id = $2 ORDER BY created_at`,
            [tenantId, storeId],
        );
    }

    async update(tenantId: string, screenId: string, patch: ScreenPatch): Promise<ScreenRow | null> {
        const fields = (['name', 'is_active'] as const).filter((field) => patch[field] !== undefined);
        const sets = fields.map((field, i) => `${field} = $${i + 3}`).join(', ');
        // pg returns [rows, affectedCount] for UPDATE
        const [rows] = await this.dataSource.query(
            `UPDATE screens SET ${sets}, updated_at = now() WHERE tenant_id = $1 AND screen_id = $2 RETURNING ${COLUMNS}`,
            [tenantId, screenId, ...fields.map((field) => patch[field])],
        );
        return rows[0] ?? null;
    }

    async findPlayerScreen(tenantId: string, token: string): Promise<PlayerScreen | null> {
        const rows = await this.dataSource.query(
            `SELECT sc.screen_id, sc.store_id, st.name AS store_name, st.slug AS store_slug
             FROM screens sc JOIN stores st ON st.store_id = sc.store_id AND st.tenant_id = sc.tenant_id
             WHERE sc.tenant_id = $1 AND sc.token = $2 AND sc.is_active AND st.is_active`,
            [tenantId, token],
        );
        return rows[0] ?? null;
    }
}
