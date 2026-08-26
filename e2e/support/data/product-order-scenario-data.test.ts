import assert from "node:assert/strict";
import { test } from "node:test";

// @ts-expect-error Node v24 direct type stripping requires an explicit .ts import (TS5097).
import { createProductOrderScenarioData } from "./product-order-scenario-data.ts";

test("создаёт независимые, но внутренне согласованные данные одного запуска", () => {
  const first = createProductOrderScenarioData("same-test-id");
  const second = createProductOrderScenarioData("same-test-id");

  assert.notEqual(first.categoryName, second.categoryName);
  assert.notEqual(first.productName, second.productName);
  assert.notEqual(first.modifierGroupName, second.modifierGroupName);
  assert.notEqual(first.customerName, second.customerName);
  assert.ok(first.productName.includes(first.categoryName.replace("E2E ", "")));
  assert.ok(
    first.modifierName.includes(
      first.modifierGroupName.replace("Добавки ", ""),
    ),
  );
});
