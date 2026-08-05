import { describe, expect, it, vi } from "vitest";

import { CatalogApi, CatalogApiError } from "./catalog.api";
import type {
  CatalogCategory,
  CatalogModifierGroupDto,
  CatalogModifierOption,
  CatalogProduct,
  CatalogProductDto,
  CatalogResponseDto,
} from "./catalog.api.types";
import { ApiClient, ApiError } from "./client";

const categoryId = "11111111-1111-4111-8111-111111111111";
const productId = "22222222-2222-4222-8222-222222222222";
const groupId = "33333333-3333-4333-8333-333333333333";
const optionId = "44444444-4444-4444-8444-444444444444";
const variantId = "55555555-5555-4555-8555-555555555555";

function createCatalogApi(fetcher: typeof fetch): CatalogApi {
  return new CatalogApi(
    new ApiClient({ baseUrl: "https://api.example.test/api/v1", fetcher }),
  );
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status });
}

function catalogResponse(): CatalogResponseDto {
  return {
    categories: [category()],
    categoryModifierGroups: [{ categoryId, groupId, sortOrder: 0 }],
    modifierGroups: [group()],
    modifierOptions: [option()],
    productVariants: [
      {
        id: variantId,
        isAvailable: true,
        priceMinor: 32000,
        productId,
        size: "M",
        sortOrder: 0,
      },
    ],
    products: [product()],
  };
}

function category(): CatalogCategory {
  return {
    description: "Напитки",
    id: categoryId,
    isActive: true,
    name: "Кофе",
    sortOrder: 0,
  };
}

function product(): Omit<CatalogProduct, "variants"> {
  return {
    categoryId,
    description: "Кофе с молоком",
    id: productId,
    isActive: true,
    isAvailable: true,
    name: "Капучино",
    priceMinor: null,
    sortOrder: 0,
    type: "DRINK",
  };
}

function productResponse(): CatalogProductDto {
  return {
    ...product(),
    variants: [
      {
        id: variantId,
        isAvailable: true,
        priceMinor: 32000,
        size: "M",
        sortOrder: 0,
      },
    ],
  };
}

function group(): CatalogModifierGroupDto {
  return {
    id: groupId,
    isActive: true,
    maxSelect: 1,
    minSelect: 0,
    name: "Молоко",
    selectionType: "single",
  };
}

function option(): CatalogModifierOption {
  return {
    groupId,
    id: optionId,
    isAvailable: true,
    isDefault: false,
    name: "Овсяное",
    priceDeltaMinor: 5000,
    sortOrder: 0,
  };
}

describe("CatalogApi", () => {
  it("сохраняет aggregate группы одним POST с вариантами", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ ...group(), options: [option()] }, 201),
      );
    const api = createCatalogApi(fetcher);
    const input = {
      isActive: true,
      maxSelect: 1,
      minSelect: 0,
      name: "Молоко",
      selectionType: "single" as const,
      options: [
        {
          isAvailable: true,
          isDefault: false,
          name: "Овсяное",
          priceDeltaMinor: 5000,
          sortOrder: 0,
        },
      ],
    };

    await expect(
      api.saveModifierGroup("access-token", input),
    ).resolves.toMatchObject({
      id: groupId,
      options: [expect.objectContaining({ id: optionId })],
    });
    const [, request] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(request.method).toBe("POST");
    expect(request.body).toBe(JSON.stringify(input));
  });

  it("сохраняет aggregate группы одним PATCH и сохраняет contextual error", async () => {
    const input = {
      id: groupId,
      isActive: true,
      maxSelect: 1,
      minSelect: 0,
      name: "Молоко",
      selectionType: "single" as const,
      options: [
        {
          id: optionId,
          isAvailable: true,
          isDefault: false,
          name: "Овсяное",
          priceDeltaMinor: 5000,
          sortOrder: 0,
        },
      ],
    };
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ ...group(), options: [option()] }, 200),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            code: "VALIDATION_ERROR",
            details: {
              fields: [{ path: "options.0.name", reason: "Обязательно" }],
            },
            message: "Ошибка",
            requestId: "request-id",
          },
          400,
        ),
      );
    const api = createCatalogApi(fetcher);

    await api.saveModifierGroup("access-token", input);
    const [, request] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(request.method).toBe("PATCH");
    expect(request.body).toBe(JSON.stringify({ ...input, id: undefined }));
    await expect(
      api.saveModifierGroup("access-token", input),
    ).rejects.toMatchObject({
      fields: [{ path: "options.0.name", reason: "Обязательно" }],
    });
  });
  it("проверяет вложенный ответ каталога и преобразует его в модель меню", async () => {
    const api = createCatalogApi(
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse(catalogResponse(), 200)),
    );

    await expect(api.getCatalog("access-token")).resolves.toEqual({
      categories: [category()],
      categoryModifierGroupAssignments: [
        { categoryId, modifierGroupId: groupId, sortOrder: 0 },
      ],
      modifierGroups: [{ ...group(), options: [option()] }],
      products: [
        {
          ...product(),
          variants: [
            {
              id: variantId,
              isAvailable: true,
              priceMinor: 32000,
              productId,
              size: "M",
              sortOrder: 0,
            },
          ],
        },
      ],
    });
  });

  it("отклоняет некорректные вложенные данные и неизвестные связи", async () => {
    const invalidResponse = {
      ...catalogResponse(),
      productVariants: [{ size: "XL" }],
    };
    const unknownReferenceResponse = {
      ...catalogResponse(),
      productVariants: [
        {
          id: variantId,
          isAvailable: true,
          priceMinor: 32000,
          productId: "66666666-6666-4666-8666-666666666666",
          size: "M",
          sortOrder: 0,
        },
      ],
    };
    const api = createCatalogApi(
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(jsonResponse(invalidResponse, 200))
        .mockResolvedValueOnce(jsonResponse(unknownReferenceResponse, 200)),
    );

    await expect(api.getCatalog("access-token")).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
    } satisfies Partial<CatalogApiError>);
    await expect(api.getCatalog("access-token")).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
    } satisfies Partial<CatalogApiError>);
  });

  it("отклоняет UUID и типы каждого transport entity", async () => {
    const responses = [
      { ...catalogResponse(), categories: [{ ...category(), id: "invalid" }] },
      { ...catalogResponse(), products: [{ ...product(), type: "FOOD" }] },
      {
        ...catalogResponse(),
        productVariants: [
          { ...catalogResponse().productVariants[0], size: "XL" },
        ],
      },
      {
        ...catalogResponse(),
        modifierGroups: [{ ...group(), selectionType: "required" }],
      },
      {
        ...catalogResponse(),
        modifierOptions: [{ ...option(), groupId: "invalid" }],
      },
      {
        ...catalogResponse(),
        categoryModifierGroups: [
          { categoryId, groupId: "invalid", sortOrder: 0 },
        ],
      },
    ];
    const fetcher = vi.fn<typeof fetch>();
    responses.forEach((response) => {
      fetcher.mockResolvedValueOnce(jsonResponse(response, 200));
    });
    const api = createCatalogApi(fetcher);

    for (let index = 0; index < responses.length; index += 1) {
      await expect(api.getCatalog("access-token")).rejects.toMatchObject({
        code: "API_CONTRACT_ERROR",
      } satisfies Partial<ApiError>);
    }
  });

  it("отклоняет все осиротевшие связи каталога", async () => {
    const unknownId = "66666666-6666-4666-8666-666666666666";
    const responses = [
      {
        ...catalogResponse(),
        products: [{ ...product(), categoryId: unknownId }],
      },
      {
        ...catalogResponse(),
        productVariants: [
          { ...catalogResponse().productVariants[0], productId: unknownId },
        ],
      },
      {
        ...catalogResponse(),
        modifierOptions: [{ ...option(), groupId: unknownId }],
      },
      {
        ...catalogResponse(),
        categoryModifierGroups: [
          { categoryId: unknownId, groupId, sortOrder: 0 },
        ],
      },
    ];
    const fetcher = vi.fn<typeof fetch>();
    responses.forEach((response) => {
      fetcher.mockResolvedValueOnce(jsonResponse(response, 200));
    });
    const api = createCatalogApi(fetcher);

    for (let index = 0; index < responses.length; index += 1) {
      await expect(api.getCatalog("access-token")).rejects.toMatchObject({
        code: "API_CONTRACT_ERROR",
      } satisfies Partial<ApiError>);
    }
  });

  it("отклоняет невалидные ответы изменяющих endpoints", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ ...category(), id: "invalid" }, 201),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            ...productResponse(),
            variants: [{ ...productResponse().variants[0], size: "XL" }],
          },
          201,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse({ ...group(), selectionType: "required" }, 201),
      )
      .mockResolvedValueOnce(
        jsonResponse({ ...option(), groupId: "invalid" }, 201),
      );
    const api = createCatalogApi(fetcher);
    const categoryCommand = {
      description: "Напитки",
      isActive: true,
      name: "Кофе",
      sortOrder: 0,
    };
    const productCommand = {
      categoryId,
      description: "Кофе с молоком",
      isActive: true,
      isAvailable: true,
      name: "Капучино",
      priceMinor: null,
      sortOrder: 0,
      type: "DRINK" as const,
      variants: [
        {
          isAvailable: true,
          priceMinor: 32000,
          size: "M" as const,
          sortOrder: 0,
        },
      ],
    };

    await expect(
      api.createCategory("access-token", categoryCommand),
    ).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
    } satisfies Partial<CatalogApiError>);
    await expect(
      api.createProduct("access-token", productCommand),
    ).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
    } satisfies Partial<CatalogApiError>);
    await expect(
      api.saveModifierGroup("access-token", {
        isActive: true,
        maxSelect: 1,
        minSelect: 0,
        name: "Молоко",
        options: [],
        selectionType: "single",
      }),
    ).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
    } satisfies Partial<ApiError>);
    await expect(
      api.createModifierOption("access-token", groupId, {
        isAvailable: true,
        isDefault: false,
        name: "Овсяное",
        priceDeltaMinor: 5000,
        sortOrder: 0,
      }),
    ).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
    } satisfies Partial<ApiError>);
  });

  it("вызывает все admin endpoints с Bearer, точным методом и статусом", async () => {
    const fetcher = vi.fn<typeof fetch>((url, init) => {
      const request = init as RequestInit;
      const response = responseFor(request.method, String(url));

      return Promise.resolve(response);
    });
    const api = createCatalogApi(fetcher);
    const token = "access-token";
    const categoryCommand = {
      description: "Напитки",
      isActive: true,
      name: "Кофе",
      sortOrder: 0,
    };
    const productCommand = {
      categoryId,
      description: "Кофе с молоком",
      isActive: true,
      isAvailable: true,
      name: "Капучино",
      priceMinor: null,
      sortOrder: 0,
      type: "DRINK" as const,
      variants: [
        {
          isAvailable: true,
          priceMinor: 32000,
          size: "M" as const,
          sortOrder: 0,
        },
      ],
    };
    const optionCommand = {
      isAvailable: true,
      isDefault: false,
      name: "Овсяное",
      priceDeltaMinor: 5000,
      sortOrder: 0,
    };

    await api.getCatalog(token);
    await api.createCategory(token, categoryCommand);
    await api.updateCategory(token, categoryId, categoryCommand);
    await api.reorderCategories(token, [categoryId]);
    await api.archiveCategory(token, categoryId);
    await api.createProduct(token, productCommand);
    await api.updateProduct(token, productId, productCommand);
    await api.reorderProducts(token, categoryId, [productId]);
    await api.archiveProduct(token, productId);
    await api.archiveModifierGroup(token, groupId);
    await api.createModifierOption(token, groupId, optionCommand);
    await api.updateModifierOption(token, optionId, optionCommand);
    await api.archiveModifierOption(token, optionId);
    await api.replaceCategoryModifierGroups(token, categoryId, [
      { categoryId, modifierGroupId: groupId, sortOrder: 0 },
    ]);

    expect(
      fetcher.mock.calls.map(([url, init]) => {
        const headers = (init as RequestInit).headers as Record<string, string>;

        return {
          authorization: headers.authorization,
          method: (init as RequestInit).method,
          url: String(url),
        };
      }),
    ).toEqual([
      request("GET", "/backoffice/catalog"),
      request("POST", "/backoffice/catalog/categories"),
      request("PATCH", `/backoffice/catalog/categories/${categoryId}`),
      request("POST", "/backoffice/catalog/categories/reorder"),
      request("DELETE", `/backoffice/catalog/categories/${categoryId}`),
      request("POST", "/backoffice/catalog/products"),
      request("PATCH", `/backoffice/catalog/products/${productId}`),
      request("POST", "/backoffice/catalog/products/reorder"),
      request("DELETE", `/backoffice/catalog/products/${productId}`),
      request("DELETE", `/backoffice/catalog/modifier-groups/${groupId}`),
      request("POST", `/backoffice/catalog/modifier-groups/${groupId}/options`),
      request(
        "PATCH",
        `/backoffice/catalog/modifier-groups/options/${optionId}`,
      ),
      request(
        "DELETE",
        `/backoffice/catalog/modifier-groups/options/${optionId}`,
      ),
      request(
        "PUT",
        `/backoffice/catalog/categories/${categoryId}/modifier-groups`,
      ),
    ]);
    expect(
      fetcher.mock.calls.map(([, init]) => (init as RequestInit).body),
    ).toEqual([
      undefined,
      JSON.stringify(categoryCommand),
      JSON.stringify(categoryCommand),
      JSON.stringify({ categoryIds: [categoryId] }),
      undefined,
      JSON.stringify(productCommand),
      JSON.stringify(productCommand),
      JSON.stringify({ categoryId, productIds: [productId] }),
      undefined,
      undefined,
      JSON.stringify(optionCommand),
      JSON.stringify(optionCommand),
      undefined,
      JSON.stringify({ groupIds: [groupId] }),
    ]);
  });

  it("преобразует только валидированные ошибки полей каталога", async () => {
    const api = createCatalogApi(
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(null, { status: 200 }))
        .mockResolvedValueOnce(
          jsonResponse(
            {
              code: "VALIDATION_ERROR",
              details: {
                fields: [
                  { path: "name", reason: "Must be a non-empty string" },
                ],
              },
              message: "Invalid catalog command",
              requestId: "request-id",
            },
            409,
          ),
        ),
    );

    await expect(
      api.archiveCategory("access-token", categoryId),
    ).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
      status: 200,
    } satisfies Partial<CatalogApiError>);
    await expect(
      api.archiveCategory("access-token", categoryId),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      fields: [{ path: "name", reason: "Must be a non-empty string" }],
      requestId: "request-id",
      status: 409,
    } satisfies Partial<CatalogApiError>);
  });

  it("отклоняет ошибку валидации с некорректными полями", async () => {
    const api = createCatalogApi(
      vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse(
          {
            code: "VALIDATION_ERROR",
            details: { fields: [{ path: "name" }] },
            message: "Invalid catalog command",
            requestId: "request-id",
          },
          400,
        ),
      ),
    );

    await expect(
      api.createCategory("access-token", {
        description: "Напитки",
        isActive: true,
        name: "Кофе",
        sortOrder: 0,
      }),
    ).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
      fields: [],
      requestId: "request-id",
      status: 400,
    } satisfies Partial<CatalogApiError>);
  });
});

function responseFor(method: string | undefined, url: string): Response {
  if (method === "GET") {
    return jsonResponse(catalogResponse(), 200);
  }

  if (method === "DELETE") {
    return new Response(null, { status: 204 });
  }

  if (url.endsWith("/options/reorder")) {
    return jsonResponse([option()], 200);
  }

  if (url.includes("/options") && !url.endsWith("/reorder")) {
    return jsonResponse(option(), method === "POST" ? 201 : 200);
  }

  if (url.includes("/modifier-groups/") && method === "PATCH") {
    return jsonResponse(group(), 200);
  }

  if (url.includes("/categories/") && url.endsWith("/modifier-groups")) {
    return jsonResponse([{ categoryId, groupId, sortOrder: 0 }], 200);
  }

  if (url.endsWith("/modifier-groups")) {
    return jsonResponse(group(), 201);
  }

  if (url.includes("/modifier-groups")) {
    return jsonResponse([{ categoryId, groupId, sortOrder: 0 }], 200);
  }

  if (url.includes("/products/reorder")) {
    return jsonResponse([productResponse()], 200);
  }

  if (url.includes("/products")) {
    return jsonResponse(productResponse(), method === "POST" ? 201 : 200);
  }

  if (url.endsWith("/categories/reorder")) {
    return jsonResponse([category()], 200);
  }

  return jsonResponse(category(), method === "POST" ? 201 : 200);
}

function request(method: string, path: string): object {
  return {
    authorization: "Bearer access-token",
    method,
    url: `https://api.example.test/api/v1${path}`,
  };
}
