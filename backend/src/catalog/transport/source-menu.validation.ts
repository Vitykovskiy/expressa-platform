import type {
  SourceCategoryWrite,
  SourceOptionWrite,
  SourceProductWrite,
} from "../application/source-menu.types";
import {
  sourceMenuMaximumInteger,
  sourceMenuUuidPattern,
} from "./source-menu.constants";
import { validationError } from "./catalog-validation-error";

export function parseSourceCategory(
  value: unknown,
  creating: boolean,
): SourceCategoryWrite {
  const body = object(value, "body");
  const name = string(body.name, "name");
  if (body.optionGroupId === undefined) {
    if (creating) {
      invalid("optionGroupId", "Must be a UUID or null");
    }
    return { name };
  }
  return {
    name,
    optionGroupId:
      body.optionGroupId === null
        ? null
        : parseSourceUuid(body.optionGroupId, "optionGroupId"),
  };
}

export function parseSourceName(value: unknown): string {
  return string(object(value, "body").name, "name");
}

export function parseSourceOption(value: unknown): SourceOptionWrite {
  const body = object(value, "body");
  return {
    name: string(body.name, "name"),
    priceDelta: integer(body.priceDelta, "priceDelta"),
  };
}

export function parseSourceProduct(value: unknown): SourceProductWrite {
  const body = object(value, "body");
  if (!Array.isArray(body.priceChoices)) {
    invalid("priceChoices", "Must be an array");
  }
  return {
    name: string(body.name, "name"),
    categoryId: parseSourceUuid(body.categoryId, "categoryId"),
    price: body.price === null ? null : integer(body.price, "price"),
    priceChoices: body.priceChoices.map((value: unknown, index: number) => {
      const choice = object(value, `priceChoices.${index}`);
      const fields = {
        portionLabel: string(
          choice.portionLabel,
          `priceChoices.${index}.portionLabel`,
        ),
        price: integer(choice.price, `priceChoices.${index}.price`),
      };
      return choice.id === undefined
        ? fields
        : {
            ...fields,
            id: parseSourceUuid(choice.id, `priceChoices.${index}.id`),
          };
    }),
  };
}

export function parseSourceUuid(value: unknown, path: string): string {
  if (typeof value !== "string" || !sourceMenuUuidPattern.test(value)) {
    invalid(path, "Must be a UUID");
  }
  return value;
}

export function parseSourceRequestId(value: unknown): string {
  return string(value, "requestId");
}

function object(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalid(path, "Must be an object");
  }
  return Object.fromEntries(Object.entries(value));
}

function string(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    invalid(path, "Must be a non-empty string");
  }
  return value;
}

function integer(value: unknown, path: string): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > sourceMenuMaximumInteger
  ) {
    invalid(path, "Must be a non-negative int32");
  }
  return value;
}

function invalid(path: string, reason: string): never {
  throw validationError([{ path, reason }]);
}
