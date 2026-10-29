import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { IScreenRepository, NewScreen, ScreenRow } from "../domain/screen.repository";

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
}
