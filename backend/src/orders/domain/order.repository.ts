export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY')

export interface OrderStore {
    store_id: string;
    name: string;
    slug: string;
    whatsapp_number: string | null;
}

export interface OrderProduct {
    product_id: string;
    name: string;
    price: string;
    is_available: boolean;
}

export interface NewOrder {
    store_id: string;
    order_number: number;
    source_screen_id: string | null;
    customer_name: string | null;
    note: string | null;
    total: string;
}

export interface NewOrderItem {
    line_number: number;
    product_id: string;
    product_name: string;
    unit_price: string;
    quantity: number;
}

// Operations that must share the one transaction of the order.
export interface IOrderTransaction {
    findProducts(tenantId: string, storeId: string, productIds: string[]): Promise<OrderProduct[]>;
    isActiveScreen(tenantId: string, storeId: string, screenId: string): Promise<boolean>;
    nextOrderNumber(tenantId: string): Promise<number>;
    insertOrder(tenantId: string, order: NewOrder): Promise<{ order_id: string; created_at: Date }>;
    insertItems(tenantId: string, orderId: string, items: NewOrderItem[]): Promise<void>;
}

export interface IOrderRepository {
    findStoreBySlug(tenantId: string, slug: string): Promise<OrderStore | null>;
    transaction<T>(work: (tx: IOrderTransaction) => Promise<T>): Promise<T>;
}
