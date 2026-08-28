import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import process from "node:process";
import ts from "typescript";

const PACKAGE_ROOT = resolve(import.meta.dirname, "..");
const SPECS_ROOT = join(PACKAGE_ROOT, "specs");
const MULTI_SESSION_FIXTURE_PATH = join(
  PACKAGE_ROOT,
  "fixtures",
  "multi-session.fixture.ts",
);
const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  "playwright-report",
  "test-results",
]);
const RAW_SELECTOR_METHODS = new Set([
  "$",
  "$$",
  "getByAltText",
  "getByLabel",
  "getByPlaceholder",
  "getByRole",
  "getByTestId",
  "getByText",
  "getByTitle",
  "frameLocator",
  "locator",
  "waitForSelector",
]);
const UI_ACTIONS = new Set([
  "blur",
  "check",
  "click",
  "dblclick",
  "dispatchEvent",
  "dragAndDrop",
  "fill",
  "focus",
  "goto",
  "hover",
  "move",
  "press",
  "selectOption",
  "setChecked",
  "setContent",
  "setInputFiles",
  "type",
  "uncheck",
]);
const NETWORK_METHODS = new Set([
  "route",
  "routeFromHAR",
  "unroute",
  "waitForRequest",
  "waitForResponse",
]);
const NETWORK_EVENT_SUBSCRIPTION_METHODS = new Set([
  "addListener",
  "off",
  "on",
  "once",
  "prependListener",
  "removeListener",
]);
const NETWORK_EVENT_NAMES = new Set(["request", "response"]);
const MULTI_SESSION_METHODS = new Set(["newContext", "newPage"]);
const FORBIDDEN_IDENTIFIERS = new Set([
  "api",
  "accesstoken",
  "fetch",
  "localstorage",
  "network",
  "request",
  "sessionstorage",
  "storage",
  "storagestate",
  "token",
]);

async function findFiles(directory, matches) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
          return IGNORED_DIRECTORIES.has(entry.name)
            ? []
            : findFiles(path, matches);
        }
        return entry.isFile() && matches(path) ? [path] : [];
      }),
    );

    return files.flat().sort();
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function findSpecFiles(directory) {
  return findFiles(directory, (path) => path.endsWith(".spec.ts"));
}

function findTypeScriptFiles(directory) {
  return findFiles(directory, (path) => path.endsWith(".ts"));
}

function addError(errors, sourceFile, node, message) {
  const line =
    sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line +
    1;
  errors.push(
    `${relative(PACKAGE_ROOT, sourceFile.fileName)}:${line} ${message}`,
  );
}

function memberName(expression) {
  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }
  return ts.isElementAccessExpression(expression) &&
    ts.isStringLiteral(expression.argumentExpression)
    ? expression.argumentExpression.text
    : null;
}

function bindingName(binding) {
  return binding && (ts.isIdentifier(binding) || ts.isStringLiteral(binding))
    ? binding.text
    : null;
}

function isFixtureTestModule(moduleSpecifier) {
  return (
    moduleSpecifier === "@fixtures/test" ||
    /(?:^|\/)fixtures\/test$/u.test(moduleSpecifier)
  );
}

function isPOMModule(moduleSpecifier) {
  return (
    /(?:^|\/)(?:pages|components)(?:\/|$)/u.test(moduleSpecifier) ||
    /@(?:pages|components)\//u.test(moduleSpecifier)
  );
}

function collectImports(sourceFile) {
  const testNames = new Set();
  const expectNames = new Set();
  const errors = [];

  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      continue;
    }
    const moduleSpecifier = statement.moduleSpecifier.text;
    const clause = statement.importClause;

    if (isPOMModule(moduleSpecifier)) {
      addError(
        errors,
        sourceFile,
        statement,
        "прямой импорт Page Object или компонента запрещён: используй fixture",
      );
    }
    if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings)) {
      continue;
    }
    for (const element of clause.namedBindings.elements) {
      const importedName = element.propertyName?.text ?? element.name.text;
      if (importedName !== "test" && importedName !== "expect") {
        continue;
      }
      if (!isFixtureTestModule(moduleSpecifier)) {
        addError(
          errors,
          sourceFile,
          element,
          `${importedName} импортируется только из fixtures/test.ts`,
        );
        continue;
      }
      if (importedName === "test") {
        testNames.add(element.name.text);
      } else {
        expectNames.add(element.name.text);
      }
    }
  }

  return { errors, expectNames, testNames };
}

function isFixtureTestExpression(expression, testNames) {
  if (ts.isIdentifier(expression)) {
    return testNames.has(expression.text);
  }
  return (
    (ts.isPropertyAccessExpression(expression) ||
      ts.isElementAccessExpression(expression)) &&
    ts.isIdentifier(expression.expression) &&
    testNames.has(expression.expression.text)
  );
}

function isTestCallback(node, testNames) {
  return (
    (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
    ts.isCallExpression(node.parent) &&
    node.parent.arguments.includes(node) &&
    isFixtureTestExpression(node.parent.expression, testNames)
  );
}

function isRawSelectorAccess(expression) {
  return (
    (ts.isPropertyAccessExpression(expression) ||
      ts.isElementAccessExpression(expression)) &&
    RAW_SELECTOR_METHODS.has(memberName(expression))
  );
}

function isForbiddenMemberAccess(expression) {
  return (
    (ts.isPropertyAccessExpression(expression) ||
      ts.isElementAccessExpression(expression)) &&
    FORBIDDEN_IDENTIFIERS.has(memberName(expression)?.toLowerCase())
  );
}

function isNetworkEventCall(node) {
  const method = memberName(node.expression);
  const eventName = node.arguments[0];
  return (
    (method === "waitForEvent" ||
      NETWORK_EVENT_SUBSCRIPTION_METHODS.has(method)) &&
    ts.isStringLiteral(eventName) &&
    NETWORK_EVENT_NAMES.has(eventName.text)
  );
}

function isSanctionedMultiSessionFixture(path) {
  return path === MULTI_SESSION_FIXTURE_PATH;
}

function isDirectMultiSessionCall(node) {
  return (
    ts.isPropertyAccessExpression(node.expression) &&
    MULTI_SESSION_METHODS.has(node.expression.name.text)
  );
}

function isForbiddenNetworkCall(node, path) {
  return (
    NETWORK_METHODS.has(memberName(node.expression)) ||
    (isDirectMultiSessionCall(node) &&
      !isSanctionedMultiSessionFixture(path)) ||
    isNetworkEventCall(node)
  );
}

function timingViolation(node) {
  const method = memberName(node.expression);
  if (method === "waitForTimeout") {
    return "waitForTimeout запрещён: используй web-first assertion";
  }
  if (method === "waitForFunction" || method === "poll") {
    return "опрос состояния запрещён: используй web-first assertion";
  }
  if (
    ts.isIdentifier(node.expression) &&
    ["setInterval", "setTimeout"].includes(node.expression.text)
  ) {
    return "фиксированная задержка запрещена: используй web-first assertion";
  }
  return null;
}

function validateTypeScriptFile(path) {
  return readFile(path, "utf8").then((source) => {
    const sourceFile = ts.createSourceFile(
      path,
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    const errors = [];
    const visit = (node) => {
      if (ts.isCallExpression(node) && isForbiddenNetworkCall(node, path)) {
        addError(
          errors,
          sourceFile,
          node,
          "API, сеть, storage и создание контекста или Page в E2E запрещены",
        );
      }
      if (ts.isCallExpression(node)) {
        const message = timingViolation(node);
        if (message) {
          addError(errors, sourceFile, node, message);
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return errors;
  });
}

function isForbiddenTestModifier(expression, testNames) {
  const testExpression =
    ts.isPropertyAccessExpression(expression) ||
    ts.isElementAccessExpression(expression)
      ? expression.expression
      : null;
  return (
    (ts.isPropertyAccessExpression(expression) ||
      ts.isElementAccessExpression(expression)) &&
    ["only", "skip"].includes(memberName(expression)) &&
    Boolean(testExpression) &&
    isFixtureTestExpression(testExpression, testNames)
  );
}

function isPageObjectConstructor(expression) {
  return (
    ts.isIdentifier(expression) && /(?:Page|Component)$/u.test(expression.text)
  );
}

function isExpectPollCallback(node, expectNames) {
  return (
    (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
    ts.isCallExpression(node.parent) &&
    node.parent.arguments.includes(node) &&
    ts.isPropertyAccessExpression(node.parent.expression) &&
    node.parent.expression.name.text === "poll" &&
    ts.isIdentifier(node.parent.expression.expression) &&
    expectNames.has(node.parent.expression.expression.text)
  );
}

function validateSpec(path) {
  return readFile(path, "utf8").then((source) => {
    const sourceFile = ts.createSourceFile(
      path,
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    const imports = collectImports(sourceFile);
    const errors = [...imports.errors];
    const visit = (node) => {
      if (
        ts.isNewExpression(node) &&
        isPageObjectConstructor(node.expression)
      ) {
        addError(
          errors,
          sourceFile,
          node,
          "прямое создание Page Object или компонента запрещено: используй fixture",
        );
      }
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === "page"
      ) {
        addError(
          errors,
          sourceFile,
          node,
          "прямой Page запрещён: используй Page Object fixture",
        );
      }
      if (
        ts.isBindingElement(node) &&
        (bindingName(node.name) === "page" ||
          bindingName(node.propertyName) === "page")
      ) {
        addError(
          errors,
          sourceFile,
          node,
          "прямой Page запрещён: используй Page Object fixture",
        );
      }
      if (ts.isCallExpression(node) && isRawSelectorAccess(node.expression)) {
        addError(
          errors,
          sourceFile,
          node,
          "raw locator в E2E spec запрещён: перенеси его в Page Object",
        );
      }
      if (
        ts.isCallExpression(node) &&
        isForbiddenMemberAccess(node.expression)
      ) {
        addError(
          errors,
          sourceFile,
          node,
          "API, сеть, storage и создание Page в E2E spec запрещены",
        );
      }
      if (ts.isCallExpression(node) && isForbiddenNetworkCall(node, path)) {
        addError(
          errors,
          sourceFile,
          node,
          "API, сеть, storage и создание контекста или Page в E2E spec запрещены",
        );
      }
      if (
        ts.isCallExpression(node) &&
        UI_ACTIONS.has(memberName(node.expression))
      ) {
        addError(
          errors,
          sourceFile,
          node,
          "низкоуровневое UI-действие в E2E spec запрещено: используй Page Object",
        );
      }
      if (isForbiddenTestModifier(node, imports.testNames)) {
        addError(errors, sourceFile, node, "test.only и test.skip запрещены");
      }
      if (
        ts.isIdentifier(node) &&
        FORBIDDEN_IDENTIFIERS.has(node.text.toLowerCase())
      ) {
        addError(
          errors,
          sourceFile,
          node,
          `запрещено прямое использование ${node.text} в E2E spec`,
        );
      }
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ((ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
          !isTestCallback(node, imports.testNames) &&
          !isExpectPollCallback(node, imports.expectNames))
      ) {
        addError(
          errors,
          sourceFile,
          node,
          "локальный helper в E2E spec запрещён",
        );
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return errors;
  });
}

const specFiles = await findSpecFiles(SPECS_ROOT);
const typeScriptFiles = await findTypeScriptFiles(PACKAGE_ROOT);
const errors = (
  await Promise.all([
    ...specFiles.map(validateSpec),
    ...typeScriptFiles.map(validateTypeScriptFile),
  ])
).flat();

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`E2E boundaries passed: ${specFiles.length} spec files.`);
}
