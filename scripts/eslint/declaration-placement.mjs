import path from "node:path";

function isStaticData(node, sourceCode) {
  if (!node) {
    return false;
  }

  switch (node.type) {
    case "Literal":
      return true;
    case "TemplateLiteral":
      return node.expressions.length === 0;
    case "UnaryExpression":
      return (
        ["-", "+", "!", "~"].includes(node.operator) &&
        isStaticData(node.argument, sourceCode)
      );
    case "TSAsExpression":
    case "TSSatisfiesExpression":
      return isStaticData(node.expression, sourceCode);
    case "ArrayExpression":
      return node.elements.every(
        (element) => element === null || isStaticData(element, sourceCode),
      );
    case "ObjectExpression":
      return node.properties.every(
        (property) =>
          property.type === "Property" &&
          !property.computed &&
          property.kind === "init" &&
          isStaticData(property.value, sourceCode),
      );
    case "CallExpression": {
      const callee = node.callee;

      if (
        callee.type !== "MemberExpression" ||
        callee.computed ||
        callee.object.type !== "Identifier" ||
        callee.object.name !== "Object" ||
        callee.property.type !== "Identifier" ||
        callee.property.name !== "freeze" ||
        node.arguments.length !== 1
      ) {
        return false;
      }

      // Локальный Object может иметь побочные эффекты; проверяем только встроенный.
      for (let scope = sourceCode.getScope(node); scope; scope = scope.upper) {
        if (scope.set.get("Object")?.defs.length > 0) {
          return false;
        }
      }

      return isStaticData(node.arguments[0], sourceCode);
    }

    default:
      return false;
  }
}

function isModuleDeclaration(node) {
  const parent = node.parent;

  return (
    parent?.type === "Program" ||
    ((parent?.type === "ExportNamedDeclaration" ||
      parent?.type === "ExportDefaultDeclaration") &&
      parent.parent?.type === "Program")
  );
}

export default {
  meta: {
    type: "suggestion",
    schema: [],
    messages: {
      typeFile:
        "Place named types, interfaces and enums in an adjacent *.types.ts file.",
      constantFile:
        "Place module-level static data in an adjacent *.constants.ts file.",
    },
  },
  create(context) {
    const filename = context.filename;
    const basename = path.basename(filename);
    const isVue = filename.endsWith(".vue");

    function checkType(node) {
      if (!basename.endsWith(".types.ts") && !basename.endsWith(".d.ts")) {
        context.report({ node, messageId: "typeFile" });
      }
    }

    return {
      TSTypeAliasDeclaration: checkType,
      TSInterfaceDeclaration: checkType,
      TSEnumDeclaration: checkType,
      VariableDeclaration(node) {
        // Script setup выполняется на экземпляр; AST не доказывает возможность выноса.
        if (
          isVue ||
          basename.endsWith(".constants.ts") ||
          !isModuleDeclaration(node) ||
          node.kind !== "const"
        ) {
          return;
        }

        for (const declaration of node.declarations) {
          if (isStaticData(declaration.init, context.sourceCode)) {
            context.report({ node: declaration, messageId: "constantFile" });
          }
        }
      },
    };
  },
};
