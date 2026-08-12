import { ConfigModule } from '@nestjs/config';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../platform/database/database.module';
import { DatabaseService } from '../platform/database/database.service';
import { PostgresOrderUnitOfWork } from './adapters/postgres-order-unit-of-work';
import { CreateOrderUseCase } from './application/create-order.use-case';
import { orderUnitOfWorkPort } from './orders.module.constants';
import { OrdersModule } from './orders.module';
import { OrdersController } from './transport/orders.controller';
import { BackofficeOrdersController } from './transport/backoffice-orders.controller';

describe('OrdersModule', () => {
  it('связывает создание заказа с PostgreSQL и зависимостями аутентификации', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
          load: [() => ({
            AUTH_ACCESS_TOKEN_SECRET: 'access-token-secret',
            AUTH_DEVELOPMENT_OTP: '123456',
            AUTH_OTP_PEPPER: 'otp-pepper',
            CORS_ORIGINS: 'http://localhost:5173',
            NODE_ENV: 'local',
          })],
        }),
        OrdersModule,
      ],
    })
      .overrideProvider(DatabaseService)
      .useValue({ connectionPool: {} })
      .compile();

    expect(module.get(OrdersController)).toBeInstanceOf(OrdersController);
    expect(module.get(CreateOrderUseCase)).toBeInstanceOf(CreateOrderUseCase);
    expect(module.get(orderUnitOfWorkPort)).toBeInstanceOf(PostgresOrderUnitOfWork);
  });

  it('регистрирует только контроллер заказов и необходимые модули', () => {
    expect(Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, OrdersModule)).toEqual([OrdersController, BackofficeOrdersController]);
    expect(Reflect.getMetadata(MODULE_METADATA.IMPORTS, OrdersModule)).toEqual([AuthModule, DatabaseModule]);
  });
});
