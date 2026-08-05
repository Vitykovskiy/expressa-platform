import { Module } from '@nestjs/common';
import type { Pool } from 'pg';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../platform/database/database.module';
import { DatabaseService } from '../platform/database/database.service';
import { PostgresOrderUnitOfWork } from './adapters/postgres-order-unit-of-work';
import { CreateOrderUseCase } from './application/create-order.use-case';
import type { OrderUnitOfWork } from './application/order-unit-of-work.types';
import { orderUnitOfWorkPort } from './orders.module.constants';
import { OrdersController } from './transport/orders.controller';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [OrdersController],
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
