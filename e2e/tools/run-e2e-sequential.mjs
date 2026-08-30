import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";

const desktopProject = "chromium";
const mobileProject = "mobile-chromium";
const blobDirectories = [
  "blob-report/sequential-desktop",
  "blob-report/sequential-mobile",
];

function validateArguments(argumentsToForward) {
  for (const argument of argumentsToForward) {
    if (
      argument === "--project" ||
      argument.startsWith("--project=") ||
      argument === "-p" ||
      argument === "--reporter" ||
      argument.startsWith("--reporter=")
    ) {
      throw new Error(
        "run-e2e-sequential управляет параметрами --project и --reporter.",
      );
    }
  }
}

function executePlaywright(commandArguments, environment) {
  return new Promise((resolve, reject) => {
    const child = spawn("playwright", commandArguments, {
      env: environment,
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
}

/**
 * Запускает desktop и mobile независимо, затем собирает их blob-результаты в один HTML-отчёт.
 */
export async function runSequentialE2e({
  argumentsToForward = [],
  environment = process.env,
  execute = executePlaywright,
  remove = rm,
} = {}) {
  validateArguments(argumentsToForward);

  await Promise.all(
    blobDirectories.map((directory) =>
      remove(directory, { force: true, recursive: true }),
    ),
  );

  const projects = [
    [desktopProject, blobDirectories[0]],
    [mobileProject, blobDirectories[1]],
  ];
  let hasFailure = false;

  for (const [project, blobDirectory] of projects) {
    try {
      const exitCode = await execute(
        [
          "test",
          `--project=${project}`,
          "--reporter=blob",
          ...argumentsToForward,
        ],
        { ...environment, PLAYWRIGHT_BLOB_OUTPUT_DIR: blobDirectory },
      );
      hasFailure ||= exitCode !== 0;
    } catch {
      hasFailure = true;
    }
  }

  try {
    const exitCode = await execute(
      ["merge-reports", "--reporter=html", ...blobDirectories],
      environment,
    );
    hasFailure ||= exitCode !== 0;
  } catch {
    hasFailure = true;
  }

  return hasFailure ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = await runSequentialE2e({
    argumentsToForward: process.argv.slice(2),
  });
}
