import path from "node:path";
import { CONTOURS, FRONT_LAYERS, IO_MODULES } from "./policy.constants.mjs";

function sourceValue(node) {
  const source = node.source ?? node.argument ?? node.parameter;

  return source?.value ?? source?.literal?.value;
}

function sessionException(importer, target, node) {
  if (
    importer === "modules/auth/useAuthEntry.ts" &&
    target === "modules/session/session.store"
  ) {
    return (
      node.type === "ImportDeclaration" &&
      node.specifiers.length > 0 &&
      node.specifiers.every(
        (specifier) =>
          specifier.type === "ImportSpecifier" &&
          specifier.imported.name === "useSessionStore",
      )
    );
  }

  let expected = null;

  if (importer === "modules/users/UsersRoute.types.ts") {
    expected = "StaffSession";
  } else if (importer === "modules/notifications/notifications.store.ts") {
    expected = "LogoutProofSupplier";
  }

  return (
    expected !== null &&
    target === "modules/session/session.types" &&
    node.type === "ImportDeclaration" &&
    node.specifiers.length > 0 &&
    node.specifiers.every(
      (specifier) =>
        specifier.type === "ImportSpecifier" &&
        specifier.imported.name === expected &&
        (node.importKind === "type" || specifier.importKind === "type"),
    )
  );
}

function invalidBackOfficeImport(importer, target, node) {
  const [owner, domain] = importer.split("/");
  const [targetOwner, targetDomain] = target.split("/");

  if (owner === "shared") {
    return ["app", "layouts", "modules"].includes(targetOwner);
  }

  if (owner === "layouts") {
    return (
      !["layouts", "shared"].includes(targetOwner) ||
      target === "shared/api" ||
      target.startsWith("shared/api/") ||
      /(?:\.store|\.api|native-[^/]+)(?:\.|$)/.test(target)
    );
  }

  if (owner === "modules") {
    return !(
      targetOwner === "shared" ||
      (targetOwner === "modules" && domain === targetDomain) ||
      sessionException(importer, target, node)
    );
  }

  return false;
}

function backendLayer(relativePath) {
  return relativePath
    .split("/")
    .find((part) =>
      ["transport", "application", "domain", "adapters"].includes(part),
    );
}

function invalidBackendImport(importer, target) {
  const layer = backendLayer(importer);
  const targetLayer = backendLayer(target);

  return (
    (layer === "domain" &&
      ["application", "transport", "adapters"].includes(targetLayer)) ||
    (layer === "application" && ["transport", "adapters"].includes(targetLayer))
  );
}

export default {
  meta: {
    type: "problem",
    schema: [
      {
        type: "object",
        properties: { contour: { enum: CONTOURS } },
        required: ["contour"],
        additionalProperties: false,
      },
    ],
    messages: {
      boundary:
        "Import '{{source}}' violates the {{contour}} dependency boundary.",
    },
  },
  create(context) {
    const contour = context.options[0].contour;
    const filename = context.filename;
    const marker = `${path.sep}${contour}${path.sep}`;
    const contourIndex = filename.lastIndexOf(marker);

    if (contourIndex < 0) {
      return {};
    }

    const contourRoot = filename.slice(0, contourIndex + marker.length - 1);
    const srcRoot = path.join(contourRoot, "src");
    const importer = path.relative(srcRoot, filename).split(path.sep).join("/");

    function checkImport(node) {
      const source = sourceValue(node);

      if (typeof source !== "string") {
        return;
      }

      function report() {
        context.report({
          node,
          messageId: "boundary",
          data: { source, contour },
        });
      }

      if (
        !source.startsWith(".") &&
        !source.startsWith("@/") &&
        !path.isAbsolute(source)
      ) {
        const packageName = source.replace(/^node:/, "").split("/")[0];

        if (
          contour === "backend" &&
          backendLayer(importer) === "domain" &&
          (source.startsWith("@nestjs/") ||
            [
              "pg",
              "express",
              "axios",
              "undici",
              "web-push",
              ...IO_MODULES,
            ].includes(packageName))
        ) {
          report();
        }

        return;
      }

      const resolved = source.startsWith("@/")
        ? path.resolve(srcRoot, source.slice(2))
        : path.resolve(path.dirname(filename), source);
      const repositoryRelative = path
        .relative(path.dirname(contourRoot), resolved)
        .split(path.sep)
        .join("/");
      const targetContour = repositoryRelative.split("/")[0];

      if (CONTOURS.includes(targetContour) && targetContour !== contour) {
        report();

        return;
      }

      const target = path
        .relative(srcRoot, resolved)
        .split(path.sep)
        .join("/")
        .replace(/\.(?:[cm]?[jt]s)$/, "");
      let invalid = false;

      if (contour === "front-office") {
        const fromLayer = FRONT_LAYERS.indexOf(importer.split("/")[0]);
        const toLayer = FRONT_LAYERS.indexOf(target.split("/")[0]);

        invalid = fromLayer >= 0 && toLayer >= 0 && toLayer < fromLayer;
      } else if (contour === "back-office") {
        invalid = invalidBackOfficeImport(importer, target, node);
      } else {
        invalid = invalidBackendImport(importer, target);
      }

      if (invalid) {
        report();
      }
    }

    return {
      ImportDeclaration: checkImport,
      ExportNamedDeclaration: checkImport,
      ExportAllDeclaration: checkImport,
      ImportExpression: checkImport,
      TSImportType: checkImport,
    };
  },
};
