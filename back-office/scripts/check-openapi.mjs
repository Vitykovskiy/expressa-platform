import { readFile } from "node:fs/promises";
import process from "node:process";
import { URL } from "node:url";

const backendContract = new URL(
  "../../backend/openapi/openapi.json",
  import.meta.url,
);
const snapshot = new URL("../contracts/openapi.json", import.meta.url);

const [backendContents, snapshotContents] = await Promise.all([
  readFile(backendContract),
  readFile(snapshot),
]);

if (!backendContents.equals(snapshotContents)) {
  process.stderr.write(
    "OpenAPI-снимок back-office не совпадает с backend/openapi/openapi.json.\n",
  );
  process.exitCode = 1;
}
