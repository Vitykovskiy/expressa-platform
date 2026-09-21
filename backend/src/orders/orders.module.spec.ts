import { MODULE_METADATA } from "@nestjs/common/constants";
import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { DatabaseModule } from "../platform/database/database.module";
import { DatabaseService } from "../platform/database/database.service";
import { SendOrderPushUseCase } from "../notifications/application/send-order-push.use-case";
import { PostgresOrderUnitOfWork } from "./adapters/postgres-order-unit-of-work";
import { CreateOrderUseCase } from "./application/create-order.use-case";
import { orderNotificationPort } from "./application/order-notification-port.types";
import { orderUnitOfWorkPort } from "./orders.module.constants";
import { OrdersModule } from "./orders.module";
import { BackofficeOrdersController } from "./transport/backoffice-orders.controller";
import { BackofficeOrdersV3Controller } from "./transport/backoffice-orders-v3.controller";
import { OrdersV3Controller } from "./transport/orders-v3.controller";

describe("OrdersModule", () => {
  it("wires current order creation dependencies", async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
          load: [
            () => ({
              AUTH_ACCESS_TOKEN_SECRET: "access-token-secret",
              AUTH_DEVELOPMENT_OTP: "123456",
              AUTH_OTP_PEPPER: "otp-pepper",
              CORS_ORIGINS: "http://localhost:5173",
              NODE_ENV: "local",
              VAPID_SUBJECT: "mailto:push@expressa.test",
              VAPID_PUBLIC_KEY:
                "BOT-VsrivTqPsMDCzS45APlNSMbgcTT5jqlrYu2-6PCRGB0YneXQDNsbrIxTAy0jJ-kUlKlWPm94PeirK8A8wCw",
              VAPID_PRIVATE_KEY: "9rZGGVplNbc2psiiiyOla_ZL-qDyrgIZqD_cpLz1G0c",
            }),
          ],
        }),
        OrdersModule,
      ],
    })
      .overrideProvider(DatabaseService)
      .useValue({ connectionPool: {} })
      .compile();

    expect(module.get(CreateOrderUseCase)).toBeInstanceOf(CreateOrderUseCase);
    expect(module.get(orderUnitOfWorkPort)).toBeInstanceOf(
      PostgresOrderUnitOfWork,
    );
    expect(module.get(orderNotificationPort)).toBe(
      module.get(SendOrderPushUseCase),
    );
  });

  it("registers only current order controllers and required modules", () => {
    expect(
      Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, OrdersModule),
    ).toEqual([
      BackofficeOrdersController,
      OrdersV3Controller,
      BackofficeOrdersV3Controller,
    ]);
    expect(Reflect.getMetadata(MODULE_METADATA.IMPORTS, OrdersModule)).toEqual([
      AuthModule,
      DatabaseModule,
      NotificationsModule,
    ]);
  });
});
