import { Module } from '@nestjs/common';
import { PublicOrdersController } from './api/public-orders.controller';
import { CreateOrderUseCase } from './application/create-order.use-case';
import { ORDER_REPOSITORY } from './domain/order.repository';
import { PostgreOrderRepository } from './infraestructure/postgre-order.repository';

@Module({
  controllers: [PublicOrdersController],
  providers: [
    { provide: ORDER_REPOSITORY, useClass: PostgreOrderRepository },
    CreateOrderUseCase,
  ],
})
export class OrdersModule {}
