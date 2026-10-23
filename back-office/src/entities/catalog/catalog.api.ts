import { requestApi } from "../../shared/api/request";
import { parseApiHttpError } from "../../shared/api/http-error";
import { CATALOG_ENDPOINT, SOURCE_MENU_ENDPOINT } from "./catalog.constants";
import {
  catalogId,
  catalogObject,
  parseCatalog,
  parseCategory,
  parseGroup,
  parseOption,
  parseProduct,
} from "./catalog.dto";
import type {
  CatalogCommand,
  CatalogReadOutcome,
  CatalogWriteOutcome,
} from "./catalog.types";

import type { ApiResult } from "../../shared/api/request.types";
import type {
  CatalogCategoryCreateDto,
  CatalogCategoryUpdateDto,
  CatalogGroupWriteDto,
  CatalogProductWriteDto,
} from "./catalog.api.types";

export async function readCatalog(
  accessToken: string,
  signal: AbortSignal,
): Promise<CatalogReadOutcome> {
  const result = await requestApi(CATALOG_ENDPOINT, {
    method: "GET",
    accessToken,
    signal,
  });

  if (result.kind === "aborted") {
    return { kind: "cancelled" };
  }

  if (result.kind !== "http") {
    return { kind: "failed" };
  }

  if (result.status === 401 || result.status === 403) {
    return { kind: "session-expired" };
  }

  const data = result.status === 200 ? parseCatalog(result.body) : null;

  return data === null ? { kind: "failed" } : { kind: "loaded", data };
}

export async function writeCatalog(
  accessToken: string,
  command: CatalogCommand,
  signal: AbortSignal,
): Promise<CatalogWriteOutcome> {
  const result = await sendCatalogCommand(accessToken, command, signal);

  if ("status" in result && (result.status === 401 || result.status === 403)) {
    return { kind: "session-expired" };
  }

  if (result.kind === "configuration-error") {
    return {
      kind: "rejected",
      message:
        "Изменение не отправлено: адрес сервиса настроен неверно. Обратитесь к администратору.",
    };
  }

  if (
    command.action === "archive" &&
    result.kind === "no-content" &&
    result.status === 204
  ) {
    return { kind: "confirmed" };
  }

  if (result.kind !== "http") {
    return { kind: "unknown" };
  }

  const expectedStatus = "id" in command.target ? 200 : 201;

  if (
    command.action !== "archive" &&
    result.status === expectedStatus &&
    validResponse(command, result.body)
  ) {
    return { kind: "confirmed" };
  }

  const error = parseApiHttpError(result.body);

  if (
    [400, 404, 409].includes(result.status) &&
    error !== null &&
    /^(CATEGORY_|PRODUCT_|MODIFIER_|VALIDATION_ERROR$)/.test(error.code)
  ) {
    return {
      kind: "rejected",
      message:
        "Изменение отклонено сервером. Проверьте данные и обновите каталог.",
    };
  }

  return { kind: "unknown" };
}

async function sendCatalogCommand(
  accessToken: string,
  command: CatalogCommand,
  signal: AbortSignal,
): Promise<ApiResult> {
  const target = command.target;
  const method = "id" in target ? ("PATCH" as const) : ("POST" as const);
  const suffix = "id" in target ? `/${encodeURIComponent(target.id)}` : "";

  switch (command.action) {
    case "archive": {
      const id = encodeURIComponent(command.target.id);
      let path: string;

      switch (command.target.kind) {
        case "category":
          path = `/api/v2/backoffice/catalog/categories/${id}`;
          break;
        case "group":
          path = `/api/v2/backoffice/catalog/modifier-groups/${id}`;
          break;
        case "option":
          path = `/api/v2/backoffice/catalog/modifier-groups/options/${id}`;
          break;
        case "product":
          path = `/api/v3/backoffice/catalog/products/${id}`;
          break;
      }

      return requestApi(path, { method: "DELETE", accessToken, signal });
    }

    case "save-category": {
      if (command.target.kind === "new-category") {
        if (command.association.kind !== "replace") {
          return { kind: "configuration-error" };
        }

        const body: CatalogCategoryCreateDto = {
          name: command.name,
          optionGroupId: command.association.groupId,
        };

        return requestApi(`${SOURCE_MENU_ENDPOINT}/categories`, {
          method: "POST",
          accessToken,
          signal,
          body,
        });
      }

      const body: CatalogCategoryUpdateDto = {
        name: command.name,
        ...(command.association.kind === "keep"
          ? {}
          : { optionGroupId: command.association.groupId }),
      };

      return requestApi(`${SOURCE_MENU_ENDPOINT}/categories${suffix}`, {
        method: "PATCH",
        accessToken,
        signal,
        body,
      });
    }

    case "save-group": {
      const body: CatalogGroupWriteDto = {
        name: command.name,
        ...command.values,
      };

      return requestApi(`/api/v2/backoffice/catalog/modifier-groups${suffix}`, {
        method,
        accessToken,
        signal,
        body,
      });
    }

    case "save-product": {
      const values = command.values;
      const body: CatalogProductWriteDto = {
        ...(values.modifierGroupIds === undefined
          ? {}
          : { modifierGroupIds: values.modifierGroupIds }),
        name: values.name,
        categoryId: values.categoryId,
        price: values.pricing.kind === "fixed" ? values.pricing.amount : null,
        priceChoices:
          values.pricing.kind === "fixed"
            ? []
            : values.pricing.choices.map((choice) => ({
                ...(choice.id === null ? {} : { id: choice.id }),
                portionLabel: choice.label,
                price: choice.amount,
              })),
      };

      return requestApi(`${SOURCE_MENU_ENDPOINT}/products${suffix}`, {
        method,
        accessToken,
        signal,
        body,
      });
    }
  }
}

function validResponse(
  command: Exclude<CatalogCommand, { readonly action: "archive" }>,
  value: unknown,
): boolean {
  try {
    const source = catalogObject(value);
    let id: string;

    switch (command.action) {
      case "save-category": {
        const category = parseCategory(source.category);

        if (
          !Array.isArray(source.modifierGroupIds) ||
          !source.modifierGroupIds.every((entry) => catalogId(entry))
        ) {
          return false;
        }

        const association = command.association;

        if (
          category.name !== command.name ||
          (association.kind === "replace" &&
            (association.groupId === null
              ? source.modifierGroupIds.length !== 0
              : source.modifierGroupIds.length !== 1 ||
                source.modifierGroupIds[0] !== association.groupId))
        ) {
          return false;
        }

        id = category.id;
        break;
      }

      case "save-group": {
        const group = parseGroup(source);

        if (!Array.isArray(source.options) || group.name !== command.name) {
          return false;
        }

        const options = source.options.map(parseOption);
        const expected = command.values;

        if (
          options.some((option) => option.groupId !== group.id) ||
          new Set(options.map((option) => option.id)).size !== options.length
        ) {
          return false;
        }

        if (
          group.selectionType !== expected.selectionType ||
          group.minSelect !== expected.minSelect ||
          group.maxSelect !== expected.maxSelect ||
          group.isActive !== expected.isActive ||
          options.length !== expected.options.length
        ) {
          return false;
        }

        for (const requested of expected.options) {
          const actual = options.find(
            (option) => option.sortOrder === requested.sortOrder,
          );

          if (
            actual === undefined ||
            actual.name !== requested.name ||
            actual.priceDelta !== requested.priceDelta ||
            actual.isDefault !== requested.isDefault ||
            actual.isAvailable !== requested.isAvailable ||
            (requested.id !== undefined && actual.id !== requested.id)
          ) {
            return false;
          }
        }

        id = group.id;
        break;
      }

      case "save-product": {
        const product = parseProduct(source);
        const expected = command.values;
        const pricing = expected.pricing;

        if (!Array.isArray(source.modifierGroupIds)) {
          return false;
        }

        const groupIds = source.modifierGroupIds.map(catalogId);

        if (
          new Set(groupIds).size !== groupIds.length ||
          (expected.modifierGroupIds !== undefined &&
            (groupIds.length !== expected.modifierGroupIds.length ||
              groupIds.some(
                (id, index) => id !== expected.modifierGroupIds?.[index],
              )))
        ) {
          return false;
        }

        if (
          product.name !== expected.name ||
          product.categoryId !== expected.categoryId ||
          product.price !== (pricing.kind === "fixed" ? pricing.amount : null)
        ) {
          return false;
        }

        if (pricing.kind === "choices") {
          if (product.priceChoices.length !== pricing.choices.length) {
            return false;
          }

          for (const [index, requested] of pricing.choices.entries()) {
            const actual = product.priceChoices[index];

            if (
              actual === undefined ||
              actual.portionLabel !== requested.label ||
              actual.price !== requested.amount ||
              (requested.id !== null && actual.id !== requested.id)
            ) {
              return false;
            }
          }
        }

        id = product.id;
        break;
      }
    }

    return !("id" in command.target) || id === command.target.id;
  } catch {
    return false;
  }
}
