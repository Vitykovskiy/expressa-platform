import { RequestMethod } from "@nestjs/common";
import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from "@nestjs/common/constants";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Test } from "@nestjs/testing";
import { Reflector } from "@nestjs/core";
import { authCryptoPort } from "../../auth/application/auth-crypto.constants";
import { clockPort } from "../../auth/application/clock.constants";
import {
  authRepositoryPort,
  sessionGuardConfigurationToken,
} from "../../auth/auth.constants";
import { rolesMetadataKey } from "../../auth/transport/roles.decorator.constants";
import { RolesGuard } from "../../auth/transport/roles.guard";
import { SessionGuard } from "../../auth/transport/session.guard";
import { CreateOrderUseCase } from "../application/create-order.use-case";
import { GetOrdersUseCase } from "../application/get-orders.use-case";
import {
  MenuItemUnavailableError,
  OrderIntakeClosedError,
  OrderTotalChangedError,
  OrderValidationError,
  IdempotencyKeyReusedError,
} from "../domain/order.errors";
import {
  idempotencyHeaderDescription,
  idempotencyHeaderName,
  idempotencyHeaderSchema,
  maximumOrderTotal,
  ordersControllerPath,
} from "./orders.controller.constants";
import { CreateOrderDto, CreateOrderItemDto } from "./create-order.dto";
import { OrdersController } from "./orders.controller";
import { ApiHttpErrorDto } from "../../platform/observability/http-error.dto";

const uuid = "6f7ef502-6ee5-4b27-84db-a118d9c710de";
const swaggerParametersMetadataKey = "swagger/apiParameters";
const swaggerModelPropertyMetadataKey = "swagger/apiModelProperties";
const swaggerResponsesMetadataKey = "swagger/apiResponse";
const body = {
  expectedTotal: 450,
  items: [
    { productId: uuid, variantId: null, modifierOptionIds: [], quantity: 1 },
  ],
};
const auth = {
  userId: "ccca6117-9fa5-4d9a-986d-8d02747cc6d5",
  sessionId: "session-id",
  phoneE164: "+79991234567",
  role: "customer" as const,
};
const order = {
  id: "ccca6117-9fa5-4d9a-986d-8d02747cc6d5",
  number: "20300102-001",
  stage: "CREATED" as const,
  total: 450,
  items: [
    {
      productId: uuid,
      variantId: null,
      productName: "Кофе",
      size: null,
      quantity: 1,
      unitTotal: 450,
      lineTotal: 450,
      modifiers: [
        {
          modifierOptionId: "fe3a8d7b-d983-4b4a-a4f0-977f94b91f7e",
          modifierName: "Овсяное",
          priceDelta: 50,
        },
      ],
    },
  ],
};

function createController(result: unknown = { order, replayed: false }) {
  const createOrder = { execute: jest.fn().mockResolvedValue(result) };
  const getOrders = {
    listForCustomer: jest.fn(),
    detailsForCustomer: jest.fn(),
  };
  const clock = { now: jest.fn(() => new Date("2030-01-02T03:04:05.000Z")) };
  return {
    controller: new OrdersController(
      createOrder as unknown as CreateOrderUseCase,
      getOrders as unknown as GetOrdersUseCase,
      clock,
    ),
    createOrder,
    getOrders,
    clock,
  };
}

describe("OrdersController", () => {
  it("создаёт заказ customer и возвращает канонический DTO", async () => {
    const { controller, createOrder, clock } = createController();

    await expect(controller.create(body, uuid, auth)).resolves.toEqual(order);
    expect(createOrder.execute).toHaveBeenCalledWith({
      customerId: auth.userId,
      idempotencyKey: uuid,
      request: { total: body.expectedTotal, items: body.items },
      now: clock.now.mock.results[0]!.value,
    });
  });

  it("возвращает тот же DTO при повторе", async () => {
    const { controller } = createController({ order, replayed: true });

    await expect(controller.create(body, uuid, auth)).resolves.toEqual(order);
  });

  it("возвращает customer историю со следующим непрозрачным курсором", async () => {
    const { controller, getOrders } = createController();
    const nextCursor = { createdAt: "2030-01-02 03:04:05.123456+00", id: uuid };
    getOrders.listForCustomer.mockResolvedValue({
      orders: [
        {
          ...order,
          createdAt: new Date("2030-01-02T03:04:05.000Z"),
          snapshot: order.items,
        },
      ],
      nextCursor,
    });

    await expect(controller.list(undefined, auth)).resolves.toEqual({
      orders: [
        {
          id: order.id,
          number: order.number,
          createdAt: "2030-01-02T03:04:05.000Z",
          stage: order.stage,
          total: order.total,
          snapshot: order.items,
        },
      ],
      nextCursor: expect.any(String),
    });
    expect(getOrders.listForCustomer).toHaveBeenCalledWith(auth.userId, null);
  });

  it("передаёт cursor PostgreSQL без потери микросекунд", async () => {
    const { controller, getOrders } = createController();
    const cursor = Buffer.from(
      JSON.stringify({ createdAt: "2030-01-02 03:04:05.123456+00", id: uuid }),
    ).toString("base64url");
    getOrders.listForCustomer.mockResolvedValue({
      orders: [],
      nextCursor: null,
    });

    await controller.list(cursor, auth);

    expect(getOrders.listForCustomer).toHaveBeenCalledWith(auth.userId, {
      createdAt: "2030-01-02 03:04:05.123456+00",
      id: uuid,
    });
  });

  it("передаёт допустимый PostgreSQL offset +15:59 без изменений", async () => {
    const { controller, getOrders } = createController();
    const createdAt = "2030-01-02 03:04:05.123456+15:59";
    const cursor = Buffer.from(
      JSON.stringify({ createdAt, id: uuid }),
    ).toString("base64url");
    getOrders.listForCustomer.mockResolvedValue({
      orders: [],
      nextCursor: null,
    });

    await controller.list(cursor, auth);

    expect(getOrders.listForCustomer).toHaveBeenCalledWith(auth.userId, {
      createdAt,
      id: uuid,
    });
  });

  it("читает только customer detail без телефона и событий staff", async () => {
    const { controller, getOrders } = createController();
    getOrders.detailsForCustomer.mockResolvedValue({
      ...order,
      createdAt: new Date("2030-01-02T03:04:05.000Z"),
      snapshot: order.items,
    });

    await expect(controller.details(uuid, auth)).resolves.toEqual({
      id: order.id,
      number: order.number,
      createdAt: "2030-01-02T03:04:05.000Z",
      stage: order.stage,
      total: order.total,
      snapshot: order.items,
    });
  });

  it("отклоняет некорректный customer cursor до чтения", async () => {
    const { controller, getOrders } = createController();

    await expect(controller.list("not-a-cursor", auth)).rejects.toMatchObject({
      status: 400,
      response: { code: "VALIDATION_ERROR" },
    });
    expect(getOrders.listForCustomer).not.toHaveBeenCalled();
  });

  it.each([
    "0000-01-02 03:04:05+00",
    "2030-02-30 03:04:05.123456+00",
    "2030-01-02 24:00:00+00",
    "2030-01-02 03:04:05+16:00",
  ])(
    "отклоняет cursor с невозможной датой, временем или offset: %s",
    async (createdAt) => {
      const { controller, getOrders } = createController();
      const cursor = Buffer.from(
        JSON.stringify({ createdAt, id: uuid }),
      ).toString("base64url");

      await expect(controller.list(cursor, auth)).rejects.toMatchObject({
        status: 400,
        response: { code: "VALIDATION_ERROR" },
      });
      expect(getOrders.listForCustomer).not.toHaveBeenCalled();
    },
  );

  it("требует SessionGuard и роль Customer", () => {
    const prototype = OrdersController.prototype;
    expect(Reflect.getMetadata(PATH_METADATA, OrdersController)).toBe(
      ordersControllerPath,
    );
    expect(Reflect.getMetadata(PATH_METADATA, prototype.create)).toBe("/");
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.create)).toBe(
      RequestMethod.POST,
    );
    expect(Reflect.getMetadata(GUARDS_METADATA, OrdersController)).toEqual([
      SessionGuard,
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(rolesMetadataKey, OrdersController)).toBe(
      "Customer",
    );
    expect(
      Reflect.getMetadata(swaggerParametersMetadataKey, prototype.create),
    ).toContainEqual({
      name: idempotencyHeaderName,
      in: "header",
      required: true,
      description: idempotencyHeaderDescription,
      schema: idempotencyHeaderSchema,
    });
    expect(responseStatuses(OrdersController)).toEqual(["401", "403", "500"]);
    expect(responseStatuses(prototype.create)).toEqual(["201", "400", "409"]);
    expect(
      Reflect.getMetadata(swaggerResponsesMetadataKey, prototype.create)[400]
        .type,
    ).toBe(ApiHttpErrorDto);
  });

  it("описывает 400 заказа общим HTTP error envelope", async () => {
    const module = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: CreateOrderUseCase, useValue: {} },
        { provide: GetOrdersUseCase, useValue: {} },
        { provide: authRepositoryPort, useValue: {} },
        { provide: authCryptoPort, useValue: {} },
        { provide: clockPort, useValue: { now: () => new Date() } },
        { provide: sessionGuardConfigurationToken, useValue: {} },
        { provide: SessionGuard, useValue: {} },
        { provide: RolesGuard, useValue: {} },
        Reflector,
      ],
    }).compile();
    const app = module.createNestApplication();

    try {
      const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().build(),
      );
      expect(document.paths["/orders"]?.post?.responses["400"]).toMatchObject({
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiHttpErrorDto" },
          },
        },
      });
      expect(document.components?.schemas?.ApiHttpErrorDto).toMatchObject({
        properties: {
          details: {
            type: "object",
            nullable: true,
            additionalProperties: true,
          },
        },
      });
    } finally {
      await app.close();
    }
  });

  it("документирует ограничения DTO, совпадающие с transport-проверкой", () => {
    expect(
      Reflect.getMetadata(
        swaggerModelPropertyMetadataKey,
        CreateOrderDto.prototype,
        "expectedTotal",
      ),
    ).toMatchObject({
      type: "integer",
      format: "int32",
      minimum: 0,
      maximum: maximumOrderTotal,
    });
    const itemsMetadata = Reflect.getMetadata(
      swaggerModelPropertyMetadataKey,
      CreateOrderDto.prototype,
      "items",
    );
    expect(itemsMetadata).toMatchObject({ isArray: true, minItems: 1 });
    expect(itemsMetadata.type()).toBe(CreateOrderItemDto);
    expect(
      Reflect.getMetadata(
        swaggerModelPropertyMetadataKey,
        CreateOrderItemDto.prototype,
        "variantId",
      ),
    ).toMatchObject({
      type: "string",
      format: "uuid",
      nullable: true,
    });
    expect(
      Reflect.getMetadata(
        swaggerModelPropertyMetadataKey,
        CreateOrderItemDto.prototype,
        "modifierOptionIds",
      ),
    ).toMatchObject({
      type: "string",
      format: "uuid",
      isArray: true,
      uniqueItems: true,
    });
    expect(
      Reflect.getMetadata(
        swaggerModelPropertyMetadataKey,
        CreateOrderItemDto.prototype,
        "quantity",
      ),
    ).toMatchObject({
      type: "integer",
      format: "int32",
      minimum: 1,
      maximum: 20,
    });
  });

  const invalidRequests: readonly [unknown, string, string][] = [
    [{ ...body, expectedTotal: -1 }, uuid, "negative expected total"],
    [{ ...body, expectedTotal: 0.5 }, uuid, "fractional expected total"],
    [{ ...body, items: [] }, uuid, "empty items"],
    [body, undefined as unknown as string, "missing header"],
    [body, "invalid-key", "malformed header"],
    [
      { ...body, items: [{ ...body.items[0], productId: "invalid-id" }] },
      uuid,
      "item id",
    ],
    [
      { ...body, items: [{ ...body.items[0], variantId: "invalid-id" }] },
      uuid,
      "variant id",
    ],
    [
      { ...body, items: [{ ...body.items[0], variantId: undefined }] },
      uuid,
      "missing variant",
    ],
    [
      {
        ...body,
        items: [{ ...body.items[0], modifierOptionIds: ["invalid-id"] }],
      },
      uuid,
      "option id",
    ],
    [
      {
        ...body,
        items: [{ ...body.items[0], modifierOptionIds: [uuid, uuid] }],
      },
      uuid,
      "duplicate options",
    ],
    [
      { ...body, items: [{ ...body.items[0], quantity: 0 }] },
      uuid,
      "zero quantity",
    ],
    [
      { ...body, items: [{ ...body.items[0], quantity: 21 }] },
      uuid,
      "excess quantity",
    ],
    [
      { ...body, items: [{ ...body.items[0], quantity: 1.5 }] },
      uuid,
      "fractional quantity",
    ],
  ];

  it.each(invalidRequests)(
    "отклоняет невалидный %s",
    async (invalidBody, idempotencyKey) => {
      const { controller, createOrder } = createController();

      await expect(
        controller.create(invalidBody as CreateOrderDto, idempotencyKey, auth),
      ).rejects.toMatchObject({
        status: 400,
        response: { code: "VALIDATION_ERROR", details: null },
      });
      expect(createOrder.execute).not.toHaveBeenCalled();
    },
  );

  it.each([
    [new OrderValidationError(), "VALIDATION_ERROR", null],
    [new OrderTotalChangedError(500), "ORDER_TOTAL_CHANGED", { total: 500 }],
    [
      new MenuItemUnavailableError(uuid),
      "MENU_ITEM_UNAVAILABLE",
      { itemId: uuid },
    ],
    [new OrderIntakeClosedError(), "ORDER_INTAKE_CLOSED", null],
    [new IdempotencyKeyReusedError(), "IDEMPOTENCY_KEY_REUSED", null],
  ])("преобразует доменную ошибку %s", async (error, code, details) => {
    const failingController = new OrdersController(
      {
        execute: jest.fn().mockRejectedValue(error),
      } as unknown as CreateOrderUseCase,
      {
        listForCustomer: jest.fn(),
        detailsForCustomer: jest.fn(),
      } as unknown as GetOrdersUseCase,
      { now: () => new Date("2030-01-02T03:04:05.000Z") },
    );

    await expect(
      failingController.create(body, uuid, auth),
    ).rejects.toMatchObject({
      status: error instanceof IdempotencyKeyReusedError ? 409 : 400,
      response: { code, message: error.message, details },
    });
  });
});

function responseStatuses(target: object): string[] {
  return Object.keys(
    Reflect.getMetadata(swaggerResponsesMetadataKey, target),
  ).sort();
}
