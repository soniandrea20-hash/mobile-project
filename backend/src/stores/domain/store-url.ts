import { StoreRow } from "./store.repository";

export const withSelfOrderUrl = (tenantSlug: string, store: StoreRow) => {
    const template = process.env.WEB_ORIGIN_TEMPLATE ?? 'http://{slug}.localhost:8081';
    return { ...store, self_order_url: `${template.replace('{slug}', tenantSlug)}/${store.slug}` };
};
