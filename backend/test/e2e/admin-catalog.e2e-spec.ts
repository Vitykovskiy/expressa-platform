import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { Pool } from "pg";
import { AppModule } from "../../src/app.module";
import { migrateDatabase } from "../../src/platform/database/migrations";
import { configureHttp } from "../../src/platform/http/http-configuration";
import { configureObservability } from "../../src/platform/observability/observability-configuration";

const databaseUrl = process.env.DATABASE_URL;
const otp = process.env.AUTH_DEVELOPMENT_OTP ?? "123456";

describe("admin catalog E2E", () => {
  let app: INestApplication;
  let pool: Pool;
  let url: string;
  let originalAcceptsNewOrders: boolean;

  beforeAll(async () => {
    if (databaseUrl === undefined)
      throw new Error("DATABASE_URL is required for e2e tests");
    pool = new Pool({ connectionString: databaseUrl });
    await migrateDatabase(pool, "migrations");
    originalAcceptsNewOrders = await readAcceptsNewOrders(pool);
    await resetState(pool);
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configureHttp(app, "local");
    configureObservability(app);
    await app.listen(0, "127.0.0.1");
    url = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;
    urlPlaceholder = url;
  });

  afterAll(async () => {
    await app?.close();
    await resetState(pool, originalAcceptsNewOrders);
    await pool?.end();
  });

  beforeEach(async () => {
    await resetState(pool, originalAcceptsNewOrders);
  });

  it("защищает и изменяет полный каталог, публикует меню и пишет аудит", async () => {
    const customer = await accessToken("customer");
    const before = await pool.query(
      "SELECT COUNT(*)::int AS count FROM categories",
    );
    const denied = await request(
      "/backoffice/catalog/categories",
      customer,
      "POST",
      categoryBody(0),
    );
    expect(denied.status).toBe(403);
    await expect(denied.json()).resolves.toMatchObject({
      code: "ACCESS_DENIED",
    });
    expect(
      (await pool.query("SELECT COUNT(*)::int AS count FROM categories"))
        .rows[0]?.count,
    ).toBe(before.rows[0]?.count);

    const administrator = await accessToken("administrator");
    const category = await json<{ id: string }>(
      await request(
        "/backoffice/catalog/categories",
        administrator,
        "POST",
        categoryBody(0),
      ),
    );
    const categoryUpdate = await request(
      `/backoffice/catalog/categories/${category.id}`,
      administrator,
      "PATCH",
      { ...categoryBody(1), name: "Горячие напитки" },
    );
    expect(categoryUpdate.status).toBe(200);
    await expect(categoryUpdate.json()).resolves.toMatchObject({
      id: category.id,
      name: "Горячие напитки",
      sortOrder: 1,
    });
    const secondCategory = await json<{ id: string }>(
      await request("/backoffice/catalog/categories", administrator, "POST", {
        ...categoryBody(0),
        name: "Выпечка",
      }),
    );
    const categoryReorder = await request(
      "/backoffice/catalog/categories/reorder",
      administrator,
      "POST",
      { categoryIds: [category.id, secondCategory.id] },
    );
    expect(categoryReorder.status).toBe(200);
    await expect(categoryReorder.json()).resolves.toEqual([
      expect.objectContaining({ id: category.id, sortOrder: 0 }),
      expect.objectContaining({ id: secondCategory.id, sortOrder: 1 }),
    ]);
    const product = await json<{
      id: string;
      variants: { id: string; size: string; sortOrder: number }[];
    }>(
      await request("/backoffice/catalog/products", administrator, "POST", {
        ...productBody(category.id),
        variants: [
          { size: "M", priceMinor: 32000, sortOrder: 0, isAvailable: true },
          { size: "L", priceMinor: 36000, sortOrder: 1, isAvailable: true },
        ],
      }),
    );
    const variantM = product.variants.find(({ size }) => size === "M");
    const variantL = product.variants.find(({ size }) => size === "L");
    if (variantM === undefined || variantL === undefined)
      throw new Error("Product response returned incomplete variants");
    const secondProduct = await json<{ id: string }>(
      await request("/backoffice/catalog/products", administrator, "POST", {
        ...productBody(category.id),
        name: "Латте",
        sortOrder: 1,
      }),
    );
    const productUpdate = await request(
      `/backoffice/catalog/products/${product.id}`,
      administrator,
      "PATCH",
      {
        ...productBody(category.id),
        name: "Капучино большой",
        sortOrder: 0,
        variants: [
          { size: "M", priceMinor: 32000, sortOrder: 1, isAvailable: true },
          { size: "L", priceMinor: 36000, sortOrder: 0, isAvailable: true },
        ],
      },
    );
    expect(productUpdate.status).toBe(200);
    const updatedProduct = await json<{
      id: string;
      variants: { id: string; size: string; sortOrder: number }[];
    }>(productUpdate, 200);
    const updatedM = updatedProduct.variants.find(({ size }) => size === "M");
    const updatedL = updatedProduct.variants.find(({ size }) => size === "L");
    if (updatedM === undefined || updatedL === undefined)
      throw new Error("Product update returned incomplete variants");
    expect(updatedProduct).toMatchObject({
      id: product.id,
      name: "Капучино большой",
    });
    expect(updatedM).toMatchObject({
      id: variantM.id,
      size: "M",
      sortOrder: 1,
    });
    expect(updatedL).toMatchObject({
      id: variantL.id,
      size: "L",
      sortOrder: 0,
    });

    const productVariantRemoval = await request(
      `/backoffice/catalog/products/${product.id}`,
      administrator,
      "PATCH",
      {
        ...productBody(category.id),
        name: "Капучино большой",
        sortOrder: 0,
        variants: [
          { size: "M", priceMinor: 32000, sortOrder: 1, isAvailable: true },
          { size: "S", priceMinor: 28000, sortOrder: 0, isAvailable: true },
        ],
      },
    );
    expect(productVariantRemoval.status).toBe(200);
    const productAfterRemoval = await json<{
      variants: { id: string; size: string; sortOrder: number }[];
    }>(productVariantRemoval, 200);
    const preservedM = productAfterRemoval.variants.find(
      ({ size }) => size === "M",
    );
    const newS = productAfterRemoval.variants.find(({ size }) => size === "S");
    if (preservedM === undefined || newS === undefined)
      throw new Error("Product removal returned incomplete variants");
    expect(preservedM).toMatchObject({ id: variantM.id, sortOrder: 1 });
    expect(newS).toMatchObject({ size: "S", sortOrder: 0 });
    expect(newS.id).not.toBe(variantM.id);
    expect(newS.id).not.toBe(variantL.id);
    const archivedVariant = await pool.query<{
      id: string;
      archived_at: Date | null;
    }>("SELECT id, archived_at FROM product_variants WHERE id = $1", [
      variantL.id,
    ]);
    expect(archivedVariant.rows).toEqual([
      expect.objectContaining({
        id: variantL.id,
        archived_at: expect.any(Date),
      }),
    ]);
    const productReorder = await request(
      "/backoffice/catalog/products/reorder",
      administrator,
      "POST",
      { categoryId: category.id, productIds: [secondProduct.id, product.id] },
    );
    expect(productReorder.status).toBe(200);
    await expect(productReorder.json()).resolves.toEqual([
      expect.objectContaining({ id: secondProduct.id, sortOrder: 0 }),
      expect.objectContaining({ id: product.id, sortOrder: 1 }),
    ]);
    const group = await json<{ id: string; options: { id: string }[] }>(
      await request(
        "/backoffice/catalog/modifier-groups",
        administrator,
        "POST",
        {
          name: "Молоко",
          selectionType: "single",
          minSelect: 0,
          maxSelect: 1,
          isActive: true,
          options: [
            {
              name: "Овсяное",
              priceDeltaMinor: 0,
              sortOrder: 0,
              isDefault: true,
              isAvailable: true,
            },
            {
              name: "Кокосовое",
              priceDeltaMinor: 5000,
              sortOrder: 1,
              isDefault: false,
              isAvailable: true,
            },
          ],
        },
      ),
    );
    const [option, secondOption] = group.options;
    if (option === undefined || secondOption === undefined)
      throw new Error("Modifier aggregate returned incomplete options");
    const groupUpdate = await request(
      `/backoffice/catalog/modifier-groups/${group.id}`,
      administrator,
      "PATCH",
      {
        name: "Растительное молоко",
        selectionType: "multiple",
        minSelect: 0,
        maxSelect: 2,
        isActive: true,
        options: [
          {
            id: secondOption.id,
            name: "Кокосовое",
            priceDeltaMinor: 5000,
            sortOrder: 0,
            isDefault: false,
            isAvailable: true,
          },
          {
            id: option.id,
            name: "Овсяное обновлённое",
            priceDeltaMinor: 0,
            sortOrder: 1,
            isDefault: true,
            isAvailable: true,
          },
        ],
      },
    );
    expect(groupUpdate.status).toBe(200);
    const assignment = await request(
      `/backoffice/catalog/categories/${category.id}/modifier-groups`,
      administrator,
      "PUT",
      { groupIds: [group.id] },
    );
    expect(assignment.status).toBe(200);

    const adminCatalog = await json<{
      categories: { id: string }[];
      products: { id: string }[];
      modifierGroups: { id: string }[];
    }>(await request("/backoffice/catalog", administrator), 200);
    expect(adminCatalog.categories.map((value) => value.id)).toContain(
      category.id,
    );
    expect(adminCatalog.products.map((value) => value.id)).toContain(
      product.id,
    );
    expect(adminCatalog.modifierGroups.map((value) => value.id)).toContain(
      group.id,
    );
    const menu = await json<{
      categories: { id: string; products: { id: string }[] }[];
    }>(await fetch(`${url}/api/v1/public/menu`), 200);
    expect(menu.categories).toContainEqual(
      expect.objectContaining({
        id: category.id,
        products: [
          expect.objectContaining({ id: secondProduct.id }),
          expect.objectContaining({ id: product.id }),
        ],
      }),
    );
    const audits = await pool.query<{
      actor_id: string;
      entity_id: string;
      action: string;
      before_state: unknown;
      after_state: unknown;
      request_id: string;
    }>(
      "SELECT actor_id, entity_id, action, before_state, after_state, request_id FROM audit_events ORDER BY created_at",
    );
    expect(audits.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "CATEGORY_CREATED",
          entity_id: category.id,
          before_state: null,
          after_state: expect.objectContaining({ id: category.id }),
        }),
        expect.objectContaining({
          action: "PRODUCT_UPDATED",
          entity_id: product.id,
          before_state: expect.any(Object),
          after_state: expect.objectContaining({ name: "Капучино большой" }),
        }),
        expect.objectContaining({
          action: "CATEGORY_MODIFIER_GROUPS_REPLACED",
          entity_id: category.id,
          before_state: [],
          after_state: [expect.objectContaining({ groupId: group.id })],
        }),
      ]),
    );
    expect(
      audits.rows.every(
        (audit) => audit.actor_id.length > 0 && audit.request_id.length > 0,
      ),
    ).toBe(true);

    expect(
      (
        await request(
          `/backoffice/catalog/modifier-groups/options/${option.id}`,
          administrator,
          "DELETE",
        )
      ).status,
    ).toBe(204);
    expect(
      (
        await request(
          `/backoffice/catalog/modifier-groups/${group.id}`,
          administrator,
          "DELETE",
        )
      ).status,
    ).toBe(204);
    expect(
      (
        await request(
          `/backoffice/catalog/products/${product.id}`,
          administrator,
          "DELETE",
        )
      ).status,
    ).toBe(204);
    expect(
      (
        await request(
          `/backoffice/catalog/categories/${category.id}`,
          administrator,
          "DELETE",
        )
      ).status,
    ).toBe(204);
    await expect(
      pool.query("SELECT archived_at FROM categories WHERE id = $1", [
        category.id,
      ]),
    ).resolves.toMatchObject({
      rows: [expect.objectContaining({ archived_at: expect.any(Date) })],
    });
  });

  it("AVAIL-14/15/16 — даёт staff атомарно менять доступность и приём заказов с аудитом", async () => {
    const administrator = await accessToken("administrator");
    const barista = await accessToken("barista");
    const baristaProfile = await json<{ id: string; phoneE164: string }>(
      await request("/me", barista),
      200,
    );
    const baristaId = baristaProfile.id;
    const category = await json<{ id: string }>(
      await request(
        "/backoffice/catalog/categories",
        administrator,
        "POST",
        categoryBody(0),
      ),
    );
    const product = await json<{ id: string; variants: Array<{ id: string }> }>(
      await request(
        "/backoffice/catalog/products",
        administrator,
        "POST",
        productBody(category.id),
      ),
    );
    const variant = product.variants[0];
    if (variant === undefined)
      throw new Error("Product response returned no variant");
    const group = await json<{ options: Array<{ id: string }> }>(
      await request(
        "/backoffice/catalog/modifier-groups",
        administrator,
        "POST",
        {
          name: "Добавка",
          selectionType: "single",
          minSelect: 0,
          maxSelect: 1,
          isActive: true,
          options: [
            {
              name: "Сироп",
              priceDeltaMinor: 0,
              sortOrder: 0,
              isDefault: true,
              isAvailable: true,
            },
          ],
        },
      ),
    );
    const option = group.options[0];
    if (option === undefined)
      throw new Error("Modifier response returned no option");

    const aggregate = await request("/backoffice/availability", barista);
    expect(aggregate.status).toBe(200);
    await expect(aggregate.json()).resolves.toMatchObject({
      intake: {
        acceptsNewOrders: true,
        updatedBy: null,
        updatedByLabel: null,
        updatedAt: null,
      },
      products: [expect.objectContaining({ id: product.id })],
    });
    const auditStart = await databaseTimestamp(pool);
    expect(
      (
        await request(
          `/backoffice/availability/product/${product.id}`,
          barista,
          "PATCH",
          { isAvailable: false },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await request(
          `/backoffice/availability/variant/${variant.id}`,
          barista,
          "PATCH",
          { isAvailable: false },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await request(
          `/backoffice/availability/modifier/${option.id}`,
          barista,
          "PATCH",
          { isAvailable: false },
        )
      ).status,
    ).toBe(200);
    const auditEnd = await databaseTimestamp(pool);
    const intake = await request(
      "/backoffice/service/intake",
      barista,
      "PATCH",
      { acceptsNewOrders: false },
    );
    const intakeResult = await json<{
      acceptsNewOrders: boolean;
      updatedBy: string | null;
      updatedByLabel: string | null;
      updatedAt: string | null;
    }>(intake, 200);
    expect(intakeResult).toMatchObject({
      acceptsNewOrders: false,
      updatedBy: baristaId,
      updatedByLabel: baristaProfile.phoneE164,
      updatedAt: expect.any(String),
    });
    const updatedAggregate = await json<{
      intake: {
        acceptsNewOrders: boolean;
        updatedBy: string | null;
        updatedByLabel: string | null;
      };
    }>(await request("/backoffice/availability", barista), 200);
    expect(updatedAggregate.intake).toMatchObject({
      acceptsNewOrders: false,
      updatedBy: baristaId,
      updatedByLabel: baristaProfile.phoneE164,
    });
    expect(
      (
        await request(
          "/backoffice/availability/product/not-a-uuid",
          barista,
          "PATCH",
          { isAvailable: false },
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await request(
          `/backoffice/availability/product/${randomUUID()}`,
          barista,
          "PATCH",
          { isAvailable: false },
        )
      ).status,
    ).toBe(404);

    await expect(
      pool.query(
        `SELECT value, updated_by, updated_at FROM service_settings WHERE key = 'accepts_new_orders'`,
      ),
    ).resolves.toMatchObject({
      rows: [
        expect.objectContaining({
          value: false,
          updated_by: expect.any(String),
          updated_at: expect.any(Date),
        }),
      ],
    });
    await expect(
      pool.query(
        `SELECT action FROM audit_events WHERE action IN ('AVAILABILITY_UPDATED', 'SERVICE_INTAKE_UPDATED') ORDER BY action`,
      ),
    ).resolves.toMatchObject({
      rows: [
        { action: "AVAILABILITY_UPDATED" },
        { action: "AVAILABILITY_UPDATED" },
        { action: "AVAILABILITY_UPDATED" },
        { action: "SERVICE_INTAKE_UPDATED" },
      ],
    });
    const availabilityAudits = await pool.query<{
      actor_id: string;
      entity_type: string;
      entity_id: string;
      created_at: Date;
    }>(
      `SELECT actor_id, entity_type, entity_id, created_at
       FROM audit_events
       WHERE action = 'AVAILABILITY_UPDATED'
         AND entity_id = ANY($1::uuid[])
       ORDER BY created_at, entity_id`,
      [[product.id, variant.id, option.id]],
    );
    expect(availabilityAudits.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actor_id: baristaId,
          entity_type: "product",
          entity_id: product.id,
        }),
        expect.objectContaining({
          actor_id: baristaId,
          entity_type: "variant",
          entity_id: variant.id,
        }),
        expect.objectContaining({
          actor_id: baristaId,
          entity_type: "modifier_option",
          entity_id: option.id,
        }),
      ]),
    );
    expect(availabilityAudits.rows).toHaveLength(3);
    for (const audit of availabilityAudits.rows) {
      expect(audit.created_at).toBeInstanceOf(Date);
      expect(audit.created_at.getTime()).toBeGreaterThanOrEqual(
        auditStart.getTime(),
      );
      expect(audit.created_at.getTime()).toBeLessThanOrEqual(
        auditEnd.getTime(),
      );
    }
  });

  it("не возвращает осиротевшие элементы после архивации их родителя", async () => {
    const administrator = await accessToken("administrator");
    const archivedCategory = await createCatalogGraph(pool, 0);
    const archivedProduct = await createCatalogGraph(pool, 1);
    const archivedGroup = await createCatalogGraph(pool, 2);
    const unaffected = await createCatalogGraph(pool, 3);

    await pool.query(
      "UPDATE categories SET archived_at = CURRENT_TIMESTAMP WHERE id = $1",
      [archivedCategory.categoryId],
    );
    await pool.query(
      "UPDATE products SET archived_at = CURRENT_TIMESTAMP WHERE id = $1",
      [archivedProduct.productId],
    );
    await pool.query(
      "UPDATE modifier_groups SET archived_at = CURRENT_TIMESTAMP WHERE id = $1",
      [archivedGroup.groupId],
    );

    const catalog = await json<AdminCatalogResponse>(
      await request("/backoffice/catalog", administrator),
      200,
    );

    expect(catalog.categories.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        archivedProduct.categoryId,
        archivedGroup.categoryId,
        unaffected.categoryId,
      ]),
    );
    expect(catalog.categories.map(({ id }) => id)).not.toContain(
      archivedCategory.categoryId,
    );
    expect(catalog.products.map(({ id }) => id)).toEqual(
      expect.arrayContaining([archivedGroup.productId, unaffected.productId]),
    );
    expect(catalog.products.map(({ id }) => id)).not.toEqual(
      expect.arrayContaining([
        archivedCategory.productId,
        archivedProduct.productId,
      ]),
    );
    expect(catalog.productVariants.map(({ id }) => id)).toEqual(
      expect.arrayContaining([archivedGroup.variantId, unaffected.variantId]),
    );
    expect(catalog.productVariants.map(({ id }) => id)).not.toEqual(
      expect.arrayContaining([
        archivedCategory.variantId,
        archivedProduct.variantId,
      ]),
    );
    expect(catalog.modifierGroups.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        archivedCategory.groupId,
        archivedProduct.groupId,
        unaffected.groupId,
      ]),
    );
    expect(catalog.modifierGroups.map(({ id }) => id)).not.toContain(
      archivedGroup.groupId,
    );
    expect(catalog.modifierOptions.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        archivedCategory.optionId,
        archivedProduct.optionId,
        unaffected.optionId,
      ]),
    );
    expect(catalog.modifierOptions.map(({ id }) => id)).not.toContain(
      archivedGroup.optionId,
    );
    expect(catalog.categoryModifierGroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          categoryId: archivedProduct.categoryId,
          groupId: archivedProduct.groupId,
        }),
        expect.objectContaining({
          categoryId: unaffected.categoryId,
          groupId: unaffected.groupId,
        }),
      ]),
    );
    expect(catalog.categoryModifierGroups).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          categoryId: archivedCategory.categoryId,
          groupId: archivedCategory.groupId,
        }),
        expect.objectContaining({
          categoryId: archivedGroup.categoryId,
          groupId: archivedGroup.groupId,
        }),
      ]),
    );
  });

  async function accessToken(
    role: "administrator" | "barista" | "customer",
  ): Promise<string> {
    const phone = `+7999${Math.floor(Math.random() * 10_000_000)
      .toString()
      .padStart(7, "0")}`;
    if (role === "administrator" || role === "barista")
      await pool.query("INSERT INTO users (phone_e164, role) VALUES ($1, $2)", [
        phone,
        role,
      ]);
    await fetch(`${url}/api/v1/auth/otp/request`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ phone }),
    });
    return (
      await json<{ accessToken: string }>(
        await fetch(`${url}/api/v1/auth/otp/verify`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ phone, code: otp }),
        }),
        200,
      )
    ).accessToken;
  }
});

function categoryBody(sortOrder: number) {
  return { name: "Кофе", description: "Напитки", sortOrder, isActive: true };
}
function productBody(categoryId: string) {
  return {
    categoryId,
    type: "DRINK",
    name: "Капучино",
    description: "Кофе с молоком",
    priceMinor: null,
    sortOrder: 0,
    isActive: true,
    isAvailable: true,
    variants: [
      { size: "M", priceMinor: 32000, sortOrder: 0, isAvailable: true },
    ],
  };
}
function headers(token?: string): Record<string, string> {
  return {
    "content-type": "application/json",
    "x-request-id": randomUUID(),
    ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
  };
}
function request(
  path: string,
  token: string,
  method = "GET",
  body?: unknown,
): Promise<Response> {
  return fetch(`${urlPlaceholder}/api/v1${path}`, {
    method,
    headers: headers(token),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function json<Result>(
  response: Response,
  expectedStatus = 201,
): Promise<Result> {
  expect(response.status).toBe(expectedStatus);
  return response.json() as Promise<Result>;
}
let urlPlaceholder = "";
type AdminCatalogResponse = {
  categories: { id: string }[];
  products: { id: string }[];
  productVariants: { id: string }[];
  modifierGroups: { id: string }[];
  modifierOptions: { id: string }[];
  categoryModifierGroups: { categoryId: string; groupId: string }[];
};
type CatalogGraph = {
  categoryId: string;
  productId: string;
  variantId: string;
  groupId: string;
  optionId: string;
};
async function createCatalogGraph(
  pool: Pool,
  sortOrder: number,
): Promise<CatalogGraph> {
  const category = await pool.query<{ id: string }>(
    "INSERT INTO categories (name, description, sort_order) VALUES ($1, '', $2) RETURNING id",
    [`Категория ${sortOrder}`, sortOrder],
  );
  const categoryId = category.rows[0]?.id;
  if (categoryId === undefined) throw new Error("Category was not created");
  const product = await pool.query<{ id: string }>(
    "INSERT INTO products (category_id, type, name, description, price_minor, sort_order) VALUES ($1, 'DRINK', $2, '', NULL, $3) RETURNING id",
    [categoryId, `Напиток ${sortOrder}`, sortOrder],
  );
  const productId = product.rows[0]?.id;
  if (productId === undefined) throw new Error("Product was not created");
  const variant = await pool.query<{ id: string }>(
    "INSERT INTO product_variants (product_id, size, price_minor, sort_order) VALUES ($1, 'M', 10000, 0) RETURNING id",
    [productId],
  );
  const variantId = variant.rows[0]?.id;
  if (variantId === undefined) throw new Error("Variant was not created");
  const group = await pool.query<{ id: string }>(
    "INSERT INTO modifier_groups (name, selection_type, min_select, max_select) VALUES ($1, 'single', 0, 1) RETURNING id",
    [`Группа ${sortOrder}`],
  );
  const groupId = group.rows[0]?.id;
  if (groupId === undefined) throw new Error("Modifier group was not created");
  const option = await pool.query<{ id: string }>(
    "INSERT INTO modifier_options (group_id, name, price_delta_minor, sort_order) VALUES ($1, $2, 0, 0) RETURNING id",
    [groupId, `Опция ${sortOrder}`],
  );
  const optionId = option.rows[0]?.id;
  if (optionId === undefined)
    throw new Error("Modifier option was not created");
  await pool.query(
    "INSERT INTO category_modifier_groups (category_id, group_id, sort_order) VALUES ($1, $2, 0)",
    [categoryId, groupId],
  );
  return { categoryId, productId, variantId, groupId, optionId };
}
async function readAcceptsNewOrders(pool: Pool): Promise<boolean> {
  const result = await pool.query<{ value: boolean }>(
    "SELECT value FROM service_settings WHERE key = 'accepts_new_orders'",
  );
  const value = result.rows[0]?.value;
  if (typeof value !== "boolean")
    throw new Error("Service intake setting is missing");
  return value;
}
async function databaseTimestamp(pool: Pool): Promise<Date> {
  const result = await pool.query<{ timestamp: Date }>(
    "SELECT CURRENT_TIMESTAMP AS timestamp",
  );
  const timestamp = result.rows[0]?.timestamp;
  if (!(timestamp instanceof Date))
    throw new Error("Database timestamp is missing");
  return timestamp;
}
async function resetState(pool: Pool, acceptsNewOrders = true): Promise<void> {
  await pool.query("DELETE FROM audit_events");
  await pool.query("DELETE FROM order_item_modifiers");
  await pool.query("DELETE FROM order_items");
  await pool.query("DELETE FROM orders");
  await pool.query("DELETE FROM order_daily_counters");
  await pool.query("DELETE FROM category_modifier_groups");
  await pool.query("DELETE FROM modifier_options");
  await pool.query("DELETE FROM product_variants");
  await pool.query("DELETE FROM products");
  await pool.query("DELETE FROM modifier_groups");
  await pool.query("DELETE FROM categories");
  await pool.query("DELETE FROM sessions");
  await pool.query("DELETE FROM otp_challenges");
  await pool.query("DELETE FROM users");
  await pool.query(
    "UPDATE service_settings SET value = $1, updated_by = NULL, updated_at = NULL WHERE key = 'accepts_new_orders'",
    [acceptsNewOrders],
  );
}
