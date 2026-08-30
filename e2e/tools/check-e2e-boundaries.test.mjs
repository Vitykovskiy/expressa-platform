import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
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
  resolve(packageRoot, "specs", "a7-relative-expected-result.spec.ts"),
];
const multiSessionFiles = [
  resolve(packageRoot, "specs", "a7-multi-session.spec.ts"),
  resolve(packageRoot, "pages", "a7-multi-session.page.ts"),
  resolve(packageRoot, "support", "a7-multi-session.ts"),
  resolve(packageRoot, "fixtures", "multi-session.fixture.ts"),
];
const fixtureTestPath = resolve(packageRoot, "fixtures", "test.ts");

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
      assert.match(
        error.stderr,
        /прямой Page разрешён только вторым аргументом expectedResult/u,
      );
      assert.match(error.stderr, /raw locator в E2E spec запрещён/u);
      return true;
    });
    await rm(fixtures[1], { force: true });

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

test("boundary checker принимает expectedResult только из @fixtures/test", async () => {
  try {
    await writeFile(
      fixtures[3],
      'import { expectedResult, test } from "../fixtures/test";\n\ntest("Relative expectedResult", async ({ page }) => {\n  await expectedResult("Состояние", page, async () => {});\n});\n',
    );
    await assert.rejects(runBoundaryCheck(), (error) => {
      assert.match(
        error.stderr,
        /expectedResult импортируется только из fixtures\/test\.ts/u,
      );
      return true;
    });
  } finally {
    await rm(fixtures[3], { force: true });
  }
});

test("boundary checker разрешает multi-session только в выделенном fixture", async () => {
  const existingFixture = await readFile(multiSessionFiles[3], "utf8").catch(
    () => null,
  );
  const existingTestFixture = await readFile(fixtureTestPath, "utf8");
  try {
    await writeFile(
      multiSessionFiles[3],
      "export async function createSession(browser) {\n  const context = await browser.newContext();\n  return context.newPage();\n}\n",
    );
    await assert.doesNotReject(runBoundaryCheck());

    await writeFile(
      multiSessionFiles[0],
      'import { test } from "@fixtures/test";\n\ntest("Второй сеанс", async ({ browser }) => { await browser.newContext(); });\n',
    );
    await assert.rejects(runBoundaryCheck(), (error) => {
      assert.match(error.stderr, /создание контекста или Page/u);
      return true;
    });
    await rm(multiSessionFiles[0], { force: true });

    await writeFile(
      multiSessionFiles[1],
      "export async function createSession(context) {\n  return context.newPage();\n}\n",
    );
    await assert.rejects(runBoundaryCheck(), (error) => {
      assert.match(error.stderr, /создание контекста или Page/u);
      return true;
    });
    await rm(multiSessionFiles[1], { force: true });

    await writeFile(
      multiSessionFiles[2],
      "export async function replaceSession(browser) {\n  return browser.newContext();\n}\n",
    );
    await assert.rejects(runBoundaryCheck(), (error) => {
      assert.match(error.stderr, /создание контекста или Page/u);
      return true;
    });
    await rm(multiSessionFiles[2], { force: true });

    await writeFile(
      fixtureTestPath,
      "export async function createSession(browser) { return browser.newContext(); }\n",
    );
    await assert.rejects(runBoundaryCheck(), (error) => {
      assert.match(error.stderr, /создание контекста или Page/u);
      return true;
    });
    await writeFile(fixtureTestPath, existingTestFixture);
  } finally {
    await Promise.all([
      rm(multiSessionFiles[0], { force: true }),
      rm(multiSessionFiles[1], { force: true }),
      rm(multiSessionFiles[2], { force: true }),
      existingFixture === null
        ? rm(multiSessionFiles[3], { force: true })
        : writeFile(multiSessionFiles[3], existingFixture),
      writeFile(fixtureTestPath, existingTestFixture),
    ]);
  }
});
