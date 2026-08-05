import type { OrderRequest, OrderSnapshotItem } from '../domain/order.types';

export type CreateOrderCommand = {
  customerId: string;
  idempotencyKey: string;
  request: OrderRequest;
  now: Date;
};

export type StoredOrder = {
  id: string;
  number: string;
  stage: 'CREATED';
  totalMinor: number;
  items: readonly OrderSnapshotItem[];
};

export type CreateOrderResult = {
  order: StoredOrder;
  replayed: boolean;
};

export interface OrderUnitOfWork {
  createOrder(command: CreateOrderCommand): Promise<CreateOrderResult>;
}
