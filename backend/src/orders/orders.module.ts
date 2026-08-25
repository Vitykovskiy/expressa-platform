import { Module } from '@nestjs/common';
import type { Pool } from 'pg';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../platform/database/database.module';
import { DatabaseService } from '../platform/database/database.service';
import { ObservabilityMetrics } from '../platform/observability/observability-metrics.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SendOrderPushUseCase } from '../notifications/application/send-order-push.use-case';
import { PostgresOrderUnitOfWork } from './adapters/postgres-order-unit-of-work';
import { PostgresOrderLifecycleRepository } from './adapters/postgres-order-lifecycle.repository';
import { CreateOrderUseCase } from './application/create-order.use-case';
import { orderNotificationPort, type OrderNotificationPort } from './application/order-notification-port.types';
import type { OrderUnitOfWork } from './application/order-unit-of-work.types';
import { GetOrdersUseCase } from './application/get-orders.use-case';
import { TransitionOrderUseCase } from './application/transition-order.use-case';
import type { OrderMetricsPort } from './application/order-metrics.types';
import type { OrderReadRepository, OrderTransitionUnitOfWork } from './application/order-lifecycle.types';
import { orderMetricsPort, orderReadRepositoryPort, orderTransitionUnitOfWorkPort, orderUnitOfWorkPort } from './orders.module.constants';
import { OrdersController } from './transport/orders.controller';
import { BackofficeOrdersController } from './transport/backoffice-orders.controller';

@Module({
  imports: [AuthModule, DatabaseModule, NotificationsModule],
  controllers: [OrdersController, BackofficeOrdersController],
  providers: [
    {
      provide: orderUnitOfWorkPort,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService) => new PostgresOrderUnitOfWork({ pool: createPoolProxy(database) }),
    },
    {
      provide: CreateOrderUseCase,
      inject: [orderUnitOfWorkPort, orderNotificationPort, orderMetricsPort],
      useFactory: (unitOfWork: OrderUnitOfWork, push: OrderNotificationPort, metrics: OrderMetricsPort) => new CreateOrderUseCase(unitOfWork, push, metrics),
    },
    { provide: orderNotificationPort, useExisting: SendOrderPushUseCase },
    {
      provide: orderMetricsPort,
      useFactory: (): OrderMetricsPort => ({
        recordOrderCreated: () => ObservabilityMetrics.recordOrderCreated(),
        recordOrderTransition: (stage) => ObservabilityMetrics.recordOrderTransition(stage),
      }),
    },
    {
      provide: PostgresOrderLifecycleRepository,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService) => new PostgresOrderLifecycleRepository({ pool: createPoolProxy(database) }),
    },
    {
      provide: orderReadRepositoryPort,
      inject: [PostgresOrderLifecycleRepository],
      useFactory: (repository: PostgresOrderLifecycleRepository) => repository,
    },
    {
      provide: orderTransitionUnitOfWorkPort,
      inject: [PostgresOrderLifecycleRepository],
      useFactory: (repository: PostgresOrderLifecycleRepository) => repository,
    },
    {
      provide: GetOrdersUseCase,
      inject: [orderReadRepositoryPort],
      useFactory: (repository: OrderReadRepository) => new GetOrdersUseCase(repository),
    },
    {
      provide: TransitionOrderUseCase,
      inject: [orderTransitionUnitOfWorkPort, orderNotificationPort, orderMetricsPort],
      useFactory: (unitOfWork: OrderTransitionUnitOfWork, push: OrderNotificationPort, metrics: OrderMetricsPort) => new TransitionOrderUseCase(unitOfWork, push, metrics),
    },
  ],
})
export class OrdersModule {}

function createPoolProxy(database: DatabaseService): Pool {
  return new Proxy({} as Pool, {
    get: (_target, property) => {
      const value = database.connectionPool[property as keyof Pool];
      return typeof value === 'function' ? value.bind(database.connectionPool) : value;
    },
  });
}
