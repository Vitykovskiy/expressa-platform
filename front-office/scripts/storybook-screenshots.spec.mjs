import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import {
  storybookResponsiveScreenshotWidths,
  storybookResponsiveTitles,
  storybookScreenshotManifestFileName,
  storybookScreenshotOutputDirectory,
  storybookScreenshotViewport,
} from "./storybook-screenshots.constants.mjs";
import { openStory } from "./storybook-test-utils.mjs";

const reference = JSON.parse(
  await readFile(new URL("./reference-index.json", import.meta.url), "utf8"),
);

const stories = Object.values(reference.entries)
  .filter((entry) => entry.type === "story")
  .sort((left, right) => left.id.localeCompare(right.id));

function isResponsiveScreen(story) {
  return storybookResponsiveTitles.some((title) =>
    story.title.startsWith(title),
  );
}

function screenshotFileNames(story) {
  const fileName = `${story.id}.png`;

  if (!isResponsiveScreen(story)) return [fileName];

  return [
    fileName,
    ...storybookResponsiveScreenshotWidths.map(
      (width) => `${story.id}-${width}.png`,
    ),
  ];
}

async function waitForStory(page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => globalThis.__STORYBOOK_PREVIEW__?.currentRender?.phase,
      ),
    )
    .toBe("finished");
  await expect(page.locator("#error-message")).toBeEmpty();
  await page.evaluate(async () => {
    await document.fonts.ready;
    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after {
        animation: none !important;
        caret-color: transparent !important;
        transition: none !important;
      }
    `;
    document.head.append(style);
  });
}

async function assertViewportFits(page, width) {
  const layout = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(
    layout.bodyScrollWidth,
    "body has horizontal overflow",
  ).toBeLessThanOrEqual(width);
  expect(
    layout.documentScrollWidth,
    "document has horizontal overflow",
  ).toBeLessThanOrEqual(width);
}

async function assertPackCoverage(expectedFiles) {
  const actualFiles = (await readdir(storybookScreenshotOutputDirectory))
    .filter((fileName) => fileName.endsWith(".png"))
    .sort();

  expect(actualFiles, "screenshot pack has stale or missing files").toEqual(
    [...expectedFiles].sort(),
  );
}

test("Customer Storybook screenshot pack соответствует текущему catalog", async ({
  page,
}) => {
  test.setTimeout(15 * 60_000);

  const runtimeFailures = [];
  let currentStoryId = "";
  let storyPhase = "before-finished";
  const recordRuntimeFailure = (message) => {
    const failure = { message, phase: storyPhase, storyId: currentStoryId };

    if (
      !runtimeFailures.some(
        (currentFailure) =>
          currentFailure.message === failure.message &&
          currentFailure.storyId === failure.storyId,
      )
    ) {
      runtimeFailures.push(failure);
    }
  };

  page.on("console", (message) => {
    if (message.type() === "error") recordRuntimeFailure(message.text());
  });
  page.on("pageerror", (error) => recordRuntimeFailure(error.message));
  page.on("requestfailed", (request) =>
    recordRuntimeFailure(
      `${request.method()} ${request.url()}: ${request.failure()?.errorText}`,
    ),
  );

  await rm(storybookScreenshotOutputDirectory, {
    force: true,
    recursive: true,
  });
  await mkdir(storybookScreenshotOutputDirectory, { recursive: true });

  const expectedFiles = new Set();
  const manifestStories = [];

  for (const story of stories) {
    currentStoryId = story.id;
    storyPhase = "before-finished";
    const widths = isResponsiveScreen(story)
      ? [
          storybookScreenshotViewport.width,
          ...storybookResponsiveScreenshotWidths,
        ]
      : [storybookScreenshotViewport.width];
    const files = screenshotFileNames(story);

    for (const [index, width] of widths.entries()) {
      const fileName = files[index];
      expectedFiles.add(fileName);
      await page.setViewportSize({ ...storybookScreenshotViewport, width });
      await openStory(page, story.id);
      await waitForStory(page);
      storyPhase = "after-finished";
      await assertViewportFits(page, width);
      await page.screenshot({
        path: join(storybookScreenshotOutputDirectory, fileName),
      });
    }

    manifestStories.push({
      files,
      id: story.id,
      responsive: isResponsiveScreen(story),
      title: story.title,
    });
  }

  await assertPackCoverage(expectedFiles);
  await writeFile(
    join(
      storybookScreenshotOutputDirectory,
      storybookScreenshotManifestFileName,
    ),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        screenshotCount: expectedFiles.size,
        storyCount: stories.length,
        stories: manifestStories,
        verification: {
          runtimeFailures,
          status: runtimeFailures.length === 0 ? "verified" : "blocked",
        },
      },
      null,
      2,
    )}\n`,
  );
  expect(runtimeFailures, "Storybook runtime errors").toEqual([]);
});

test("Customer Storybook screenshot pack не содержит stale files", async () => {
  const manifest = JSON.parse(
    await readFile(
      join(
        storybookScreenshotOutputDirectory,
        storybookScreenshotManifestFileName,
      ),
      "utf8",
    ),
  );
  const expectedFiles = manifest.stories.flatMap((story) => story.files);

  expect(manifest.storyCount).toBe(stories.length);
  expect(manifest.screenshotCount).toBe(expectedFiles.length);
  expect(expectedFiles).toEqual(
    stories.flatMap((story) => screenshotFileNames(story)),
  );
  await assertPackCoverage(expectedFiles);
});
