import type { OrderStage } from '../domain/order-lifecycle.types';

export type OrderMetricsPort = {
  recordOrderCreated(): void;
  recordOrderTransition(stage: OrderStage): void;
};
