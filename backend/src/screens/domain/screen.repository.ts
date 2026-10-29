export interface ScreenRow {
    screen_id: string;
    store_id: string;
    name: string;
    token: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface NewScreen { store_id: string; name: string; token: string }

export interface PlayerScreen { screen_id: string; store_id: string; store_name: string; store_slug: string }

export interface IScreenRepository {
    create(tenantId: string, screen: NewScreen): Promise<ScreenRow>;
    listByStore(tenantId: string, storeId: string): Promise<ScreenRow[]>;
    // Only if the screen and its store are both active.
    findPlayerScreen(tenantId: string, token: string): Promise<PlayerScreen | null>;
}

export const SCREEN_REPOSITORY = Symbol('SCREEN_REPOSITORY');
