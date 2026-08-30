import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import {
  configureHttp,
  createOpenApiDocument,
} from "../src/platform/http/http-configuration";

const outputPath = resolve(process.cwd(), "openapi/openapi.json");

async function createOpenApiSpecification(): Promise<string> {
  const app = await NestFactory.create(AppModule, { logger: false });

  try {
    configureHttp(app, "production");

    return `${JSON.stringify(createOpenApiDocument(app), null, 2)}\n`;
  } finally {
    await app.close();
  }
}

async function main(): Promise<void> {
  const specification = await createOpenApiSpecification();

  if (process.argv.includes("--check")) {
    const currentSpecification = await readFile(outputPath, "utf8");

    if (currentSpecification !== specification) {
      throw new Error(
        "OpenAPI specification is outdated. Run npm run openapi:generate.",
      );
    }

    return;
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, specification);
}

void main();
