import assert from "node:assert/strict";
import test from "node:test";

import { runSequentialE2e } from "./run-e2e-sequential.mjs";

function createRunner({ exitCodes = [], rejects = [] } = {}) {
  const calls = [];
  const removals = [];

  return {
    calls,
    removals,
    run: () =>
      runSequentialE2e({
        argumentsToForward: ["--grep", "заказ"],
        execute: async (argumentsToRun, environment) => {
          calls.push({ argumentsToRun, environment });
          if (rejects.shift()) {
            throw new Error("Playwright не запустился.");
          }
          return exitCodes.shift() ?? 0;
        },
        remove: async (directory, options) => {
          removals.push({ directory, options });
        },
      }),
  };
}

test("последовательно запускает desktop, mobile и единый отчёт", async () => {
  const runner = createRunner();

  const exitCode = await runner.run();

  assert.equal(exitCode, 0);
  assert.deepEqual(
    runner.calls.map(({ argumentsToRun }) => argumentsToRun),
    [
      ["test", "--project=chromium", "--reporter=blob", "--grep", "заказ"],
      [
        "test",
        "--project=mobile-chromium",
        "--reporter=blob",
        "--grep",
        "заказ",
      ],
      [
        "merge-reports",
        "--reporter=html",
        "blob-report/sequential-desktop",
        "blob-report/sequential-mobile",
      ],
    ],
  );
  assert.deepEqual(runner.removals, [
    {
      directory: "blob-report/sequential-desktop",
      options: { force: true, recursive: true },
    },
    {
      directory: "blob-report/sequential-mobile",
      options: { force: true, recursive: true },
    },
  ]);
});

test("после падения desktop запускает mobile и собирает отчёт", async () => {
  const runner = createRunner({ exitCodes: [1, 0, 0] });

  const exitCode = await runner.run();

  assert.equal(exitCode, 1);
  assert.equal(runner.calls[1].argumentsToRun[1], "--project=mobile-chromium");
  assert.equal(runner.calls[2].argumentsToRun[0], "merge-reports");
});

test("отражает ошибку объединения в итоговом коде", async () => {
  const runner = createRunner({ exitCodes: [0, 0, 1] });

  assert.equal(await runner.run(), 1);
});

test("продолжает после ошибки запуска desktop", async () => {
  const runner = createRunner({ rejects: [true, false, false] });

  assert.equal(await runner.run(), 1);
  assert.equal(runner.calls.length, 3);
});

test("запрещает переопределять управляемые параметры", async () => {
  await assert.rejects(
    runSequentialE2e({ argumentsToForward: ["--project=firefox"] }),
    /управляет параметрами --project и --reporter/u,
  );
  await assert.rejects(
    runSequentialE2e({ argumentsToForward: ["--reporter", "list"] }),
    /управляет параметрами --project и --reporter/u,
  );
});
