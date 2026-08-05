import { Test, type TestingModule } from '@nestjs/testing';
import { createRequire } from 'node:module';
import { DevelopmentOtpAdapter } from './auth/adapters/development-otp.adapter';
import { otpCodeGeneratorPort, smsSenderPort } from './auth/auth.constants';
import { GetPublicMenuUseCase } from './catalog/application/get-public-menu.use-case';
import { CatalogModule } from './catalog/catalog.module';
import { CreateOrderUseCase } from './orders/application/create-order.use-case';
import { OrdersModule } from './orders/orders.module';

const loadModule = createRequire(__filename);

describe('AppModule', () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnvironment,
      NODE_ENV: 'local',
      PORT: '3000',
      DATABASE_URL: 'postgresql://expressa:expressa@localhost:5432/expressa',
      AUTH_ACCESS_TOKEN_SECRET: 'local-access-token-secret',
      AUTH_OTP_PEPPER: 'local-otp-pepper',
      AUTH_DEVELOPMENT_OTP: '123456',
      CORS_ORIGINS: 'http://localhost:5173',
    };
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it('создаёт корневой модуль приложения', async () => {
    const { AuthModule }: typeof import('./auth/auth.module') = loadModule('./auth/auth.module');
    const { AppModule }: typeof import('./app.module') = loadModule('./app.module');
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(module).toBeDefined();
    expect(module.select(AuthModule).get(otpCodeGeneratorPort, { strict: true })).toBeInstanceOf(DevelopmentOtpAdapter);
    expect(module.select(AuthModule).get(smsSenderPort, { strict: true })).toBeInstanceOf(DevelopmentOtpAdapter);
    expect(module.select(CatalogModule).get(GetPublicMenuUseCase, { strict: true })).toBeInstanceOf(GetPublicMenuUseCase);
    expect(module.select(OrdersModule).get(CreateOrderUseCase, { strict: true })).toBeInstanceOf(CreateOrderUseCase);
  });
});
