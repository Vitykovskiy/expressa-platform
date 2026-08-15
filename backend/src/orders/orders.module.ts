import { Module } from '@nestjs/common';
import type { Pool } from 'pg';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../platform/database/database.module';
import { DatabaseService } from '../platform/database/database.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SendOrderPushUseCase } from '../notifications/application/send-order-push.use-case';
import { PostgresOrderUnitOfWork } from './adapters/postgres-order-unit-of-work';
import { PostgresOrderLifecycleRepository } from './adapters/postgres-order-lifecycle.repository';
import { CreateOrderUseCase } from './application/create-order.use-case';
import type { OrderUnitOfWork } from './application/order-unit-of-work.types';
import { GetOrdersUseCase } from './application/get-orders.use-case';
import { TransitionOrderUseCase } from './application/transition-order.use-case';
import type { OrderReadRepository, OrderTransitionUnitOfWork } from './application/order-lifecycle.types';
import { orderReadRepositoryPort, orderTransitionUnitOfWorkPort, orderUnitOfWorkPort } from './orders.module.constants';
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
      inject: [orderUnitOfWorkPort, SendOrderPushUseCase],
      useFactory: (unitOfWork: OrderUnitOfWork, push: SendOrderPushUseCase) => new CreateOrderUseCase(unitOfWork, push),
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
      inject: [orderTransitionUnitOfWorkPort, SendOrderPushUseCase],
      useFactory: (unitOfWork: OrderTransitionUnitOfWork, push: SendOrderPushUseCase) => new TransitionOrderUseCase(unitOfWork, push),
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
