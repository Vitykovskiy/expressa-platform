import { randomUUID } from "node:crypto";

import { ProductSize } from "@pages/front-office/menu/public-menu/product-configurator/product-configurator.types";

export interface ProductOrderScenarioData {
  readonly categoryName: string;
  readonly productName: string;
  readonly productDescription: string;
  readonly productPrice: string;
  readonly productSize: ProductSize;
  readonly productQuantity: number;
  readonly modifierGroupName: string;
  readonly modifierName: string;
  readonly customerName: string;
}

export function createProductOrderScenarioData(
  runId: string,
): ProductOrderScenarioData {
  const suffix = `${runId.replace(/[^a-zA-Z0-9]/g, "").slice(-6)}${randomUUID().slice(0, 8)}`;

  return {
    categoryName: `E2E ${suffix}`,
    productName: `Напиток E2E ${suffix}`,
    productDescription: `Проверка E2E ${suffix}`,
    productPrice: "199",
    productSize: ProductSize.M,
    productQuantity: 2,
    modifierGroupName: `Добавки E2E ${suffix}`,
    modifierName: `Добавка E2E ${suffix}`,
    customerName: `Гость ${suffix}`,
  };
}
