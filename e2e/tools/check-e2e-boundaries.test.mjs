import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const executeFile = promisify(execFile);
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = [
  resolve(packageRoot, "specs", "a7-empty-fixture.spec.ts"),
  resolve(packageRoot, "specs", "a7-raw-page.spec.ts"),
  resolve(packageRoot, "specs", "a7-raw-alias-page.spec.ts"),
];

async function runBoundaryCheck() {
  return executeFile("node", ["tools/check-e2e-boundaries.mjs"], {
    cwd: packageRoot,
  });
}

test("boundary checker принимает fixture по alias и отклоняет прямой Page Object по alias", async () => {
  try {
    await writeFile(
      fixtures[0],
      'import { test } from "@fixtures/test";\n\ntest("Пустой fixture", async ({}) => {});\n',
    );
    await assert.doesNotReject(runBoundaryCheck());

    await writeFile(
      fixtures[1],
      'import { test } from "../fixtures/test";\n\ntest("Прямой Page", async ({ page }) => { await page.locator("button").click(); });\n',
    );
    await assert.rejects(runBoundaryCheck(), (error) => {
      assert.match(error.stderr, /прямой Page запрещён/u);
      assert.match(error.stderr, /raw locator в E2E spec запрещён/u);
      return true;
    });

    await writeFile(
      fixtures[2],
      'import { PublicMenuPage } from "@pages/front-office/menu/public-menu.page";\n\nvoid PublicMenuPage;\n',
    );
    await assert.rejects(runBoundaryCheck(), (error) => {
      assert.match(
        error.stderr,
        /прямой импорт Page Object или компонента запрещён/u,
      );
      return true;
    });
  } finally {
    await Promise.all(fixtures.map((fixture) => rm(fixture, { force: true })));
  }
});
