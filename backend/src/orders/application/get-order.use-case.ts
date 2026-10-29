import { Inject, Injectable } from "@nestjs/common";
import { orderNotFound } from "../domain/order.errors";
import { ORDER_REPOSITORY, type IOrderRepository } from "../domain/order.repository";

@Injectable()
export class GetOrderUseCase {

    constructor(
        @Inject(ORDER_REPOSITORY)
        private readonly orderRepository: IOrderRepository,
    ){}

    async execute(tenantId: string, orderId: string){
        const order = await this.orderRepository.findById(tenantId, orderId);
        if (!order) throw orderNotFound();
        return order;
    }
}
