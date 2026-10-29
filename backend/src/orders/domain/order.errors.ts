import { ConflictException, NotFoundException } from "@nestjs/common";

export interface UnavailableProduct { product_id: string; name?: string; reason: 'unavailable' | 'not_found' }

export const storeNotFound = () =>
    new NotFoundException({ statusCode: 404, message: 'Store not found', error: 'Not Found', code: 'STORE_NOT_FOUND' });

export const productsUnavailable = (details: UnavailableProduct[]) =>
    new ConflictException({
        statusCode: 409, message: 'Hay productos que ya no están disponibles', error: 'Conflict', code: 'PRODUCTS_UNAVAILABLE', details,
    });
