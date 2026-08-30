import type {
  CustomerOrder,
  CustomerOrdersCursor,
  CustomerOrdersPage,
  ListOrdersQuery,
  OrderReadRepository,
} from "./order-lifecycle.types";
import type {
  OrderDetails,
  OrderQueueItem,
} from "../domain/order-lifecycle.types";
import { OrderNotFoundError } from "../domain/order-lifecycle.errors";

export class GetOrdersUseCase {
  constructor(private readonly repository: OrderReadRepository) {}

  list(query: ListOrdersQuery): Promise<readonly OrderQueueItem[]> {
    return this.repository.list(query);
  }

  async details(orderId: string): Promise<OrderDetails> {
    const order = await this.repository.findDetails(orderId);
    if (order === null) throw new OrderNotFoundError();
    return order;
  }

  listForCustomer(
    customerId: string,
    cursor: CustomerOrdersCursor | null,
  ): Promise<CustomerOrdersPage> {
    return this.repository.listForCustomer(customerId, cursor);
  }

  async detailsForCustomer(
    customerId: string,
    orderId: string,
  ): Promise<CustomerOrder> {
    const order = await this.repository.findDetailsForCustomer(
      customerId,
      orderId,
    );
    if (order === null) throw new OrderNotFoundError();
    return order;
  }
}
