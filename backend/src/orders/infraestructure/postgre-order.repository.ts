import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, EntityManager } from "typeorm";
import {
    IOrderRepository, IOrderTransaction, NewOrder, NewOrderItem, OrderProduct, OrderStore,
} from "../domain/order.repository";

class PostgreOrderTransaction implements IOrderTransaction {

    constructor(private readonly manager: EntityManager){}

    findProducts(tenantId: string, storeId: string, productIds: string[]): Promise<OrderProduct[]> {
        return this.manager.query(
            `SELECT product_id, name, price, is_available FROM products
             WHERE tenant_id = $1 AND store_id = $2 AND product_id = ANY($3::uuid[])`,
            [tenantId, storeId, productIds],
        );
    }

    async isActiveScreen(tenantId: string, storeId: string, screenId: string): Promise<boolean> {
        const rows = await this.manager.query(
            'SELECT 1 FROM screens WHERE screen_id = $1 AND tenant_id = $2 AND store_id = $3 AND is_active = true LIMIT 1',
            [screenId, tenantId, storeId],
        );
        return rows.length > 0;
    }

    // The row lock held until commit serializes concurrent orders of the same tenant.
    async nextOrderNumber(tenantId: string): Promise<number> {
        const rows = await this.manager.query(
            'UPDATE tenants SET last_order_number = last_order_number + 1 WHERE tenant_id = $1 RETURNING last_order_number',
            [tenantId],
        );
        return rows[0].last_order_number;
    }

    async insertOrder(tenantId: string, order: NewOrder): Promise<{ order_id: string; created_at: Date }> {
        const rows = await this.manager.query(
            `INSERT INTO orders (tenant_id, store_id, order_number, status, source_screen_id, customer_name, note, total)
             VALUES ($1, $2, $3, 'generada', $4, $5, $6, $7) RETURNING order_id, created_at`,
            [tenantId, order.store_id, order.order_number, order.source_screen_id, order.customer_name, order.note, order.total],
        );
        return rows[0];
    }

    // line_total is a generated column: never inserted.
    async insertItems(tenantId: string, orderId: string, items: NewOrderItem[]): Promise<void> {
        for (const item of items) {
            await this.manager.query(
                `INSERT INTO order_items (order_id, line_number, tenant_id, product_id, product_name, unit_price, quantity)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [orderId, item.line_number, tenantId, item.product_id, item.product_name, item.unit_price, item.quantity],
            );
        }
    }
}

@Injectable()
export class PostgreOrderRepository implements IOrderRepository {

    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource
    ){}

    async findStoreBySlug(tenantId: string, slug: string): Promise<OrderStore | null> {
        const rows = await this.dataSource.query(
            'SELECT store_id, name, slug, whatsapp_number FROM stores WHERE tenant_id = $1 AND slug = $2 AND is_active = true LIMIT 1',
            [tenantId, slug],
        );
        return rows[0] ?? null;
    }

    transaction<T>(work: (tx: IOrderTransaction) => Promise<T>): Promise<T> {
        return this.dataSource.transaction((manager) => work(new PostgreOrderTransaction(manager)));
    }
}
