export interface ContentRow {
    content_id: string;
    store_id: string;
    type: 'image' | 'video';
    file_path: string;
    original_name: string;
    mime_type: string;
    size_bytes: string | number; // BIGINT arrives as string from pg
    duration_seconds: number;
    sort_order: number;
    is_visible: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface NewContent {
    store_id: string;
    type: 'image' | 'video';
    file_path: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    duration_seconds: number;
}

export interface ContentPatch { duration_seconds?: number; is_visible?: boolean }

export interface IContentRepository {
    listByStore(tenantId: string, storeId: string): Promise<ContentRow[]>;
    findOne(tenantId: string, contentId: string): Promise<ContentRow | null>;
    // Appends at the end of the store's playlist (sort_order = max + 1), visible.
    create(tenantId: string, data: NewContent): Promise<ContentRow>;
    update(tenantId: string, contentId: string, patch: ContentPatch): Promise<ContentRow | null>;
    // Assigns sort_order 1..n in the given order, in one transaction. Returns the items in the new order.
    reorder(tenantId: string, storeId: string, contentIds: string[]): Promise<ContentRow[]>;
    // Deletes the row and leaves the remaining sort_order consecutive, in one transaction.
    delete(tenantId: string, contentId: string): Promise<ContentRow | null>;
}

export const CONTENT_REPOSITORY = Symbol('CONTENT_REPOSITORY');

export const toContentResponse = (row: ContentRow) => ({
    content_id: row.content_id,
    store_id: row.store_id,
    type: row.type,
    url: `/media/${row.file_path}`,
    original_name: row.original_name,
    mime_type: row.mime_type,
    size_bytes: Number(row.size_bytes),
    duration_seconds: row.duration_seconds,
    sort_order: row.sort_order,
    is_visible: row.is_visible,
    created_at: row.created_at,
    updated_at: row.updated_at,
});
