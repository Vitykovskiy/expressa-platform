import { GetOrdersUseCase } from "./get-orders.use-case";
import { OrderNotFoundError } from "../domain/order-lifecycle.errors";
import type { OrderReadRepository } from "./order-lifecycle.types";

describe("GetOrdersUseCase", () => {
  it("передаёт фильтр очереди в репозиторий", async () => {
    const expected = [{ id: "order-id", stage: "ISSUED" as const }];
    const repository = createRepository({
      list: jest.fn().mockResolvedValue(expected),
    });
    const useCase = new GetOrdersUseCase(repository);

    await expect(
      useCase.list({ stage: "ISSUED", number: "001" }),
    ).resolves.toBe(expected);
    expect(repository.list).toHaveBeenCalledWith({
      stage: "ISSUED",
      number: "001",
    });
  });

  it("сигнализирует отсутствие деталей заказа", async () => {
    const repository = createRepository({
      findDetails: jest.fn().mockResolvedValue(null),
    });
    const useCase = new GetOrdersUseCase(repository);

    await expect(useCase.details("order-id")).rejects.toBeInstanceOf(
      OrderNotFoundError,
    );
  });

  it("читает только страницу заказов customer с курсором", async () => {
    const page = { orders: [], nextCursor: null };
    const repository = createRepository({
      listForCustomer: jest.fn().mockResolvedValue(page),
    });
    const useCase = new GetOrdersUseCase(repository);
    const cursor = {
      createdAt: "2030-01-02 03:04:05.123456+00",
      id: "6f7ef502-6ee5-4b27-84db-a118d9c710de",
    };

    await expect(useCase.listForCustomer("customer-id", cursor)).resolves.toBe(
      page,
    );
    expect(repository.listForCustomer).toHaveBeenCalledWith(
      "customer-id",
      cursor,
    );
  });

  it("не раскрывает чужой заказ customer", async () => {
    const repository = createRepository({
      findDetailsForCustomer: jest.fn().mockResolvedValue(null),
    });
    const useCase = new GetOrdersUseCase(repository);

    await expect(
      useCase.detailsForCustomer("customer-id", "order-id"),
    ).rejects.toBeInstanceOf(OrderNotFoundError);
  });
});

function createRepository(
  overrides: Partial<OrderReadRepository>,
): OrderReadRepository {
  return {
    list: jest.fn(),
    findDetails: jest.fn(),
    listForCustomer: jest.fn(),
    findDetailsForCustomer: jest.fn(),
    ...overrides,
  };
}
