import { NotFoundException } from "@nestjs/common";

export const storeNotFound = () =>
    new NotFoundException({ statusCode: 404, message: 'Store not found', error: 'Not Found', code: 'STORE_NOT_FOUND' });

export const screenNotFound = () =>
    new NotFoundException({ statusCode: 404, message: 'Screen not found', error: 'Not Found', code: 'SCREEN_NOT_FOUND' });
