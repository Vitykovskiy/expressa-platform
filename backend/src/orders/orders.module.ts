import { Module } from '@nestjs/common';
import type { Pool } from 'pg';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../platform/database/database.module';
import { DatabaseService } from '../platform/database/database.service';
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
  imports: [AuthModule, DatabaseModule],
  controllers: [OrdersController, BackofficeOrdersController],
  providers: [
    {
      provide: orderUnitOfWorkPort,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService) => new PostgresOrderUnitOfWork({ pool: createPoolProxy(database) }),
    },
    {
      provide: CreateOrderUseCase,
      inject: [orderUnitOfWorkPort],
      useFactory: (unitOfWork: OrderUnitOfWork) => new CreateOrderUseCase(unitOfWork),
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
      inject: [orderTransitionUnitOfWorkPort],
      useFactory: (unitOfWork: OrderTransitionUnitOfWork) => new TransitionOrderUseCase(unitOfWork),
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
