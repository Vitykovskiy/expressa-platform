import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import {
  storybookResponsiveScreenshotWidths,
  storybookResponsiveTitles,
  storybookScreenshotManifestFileName,
  storybookScreenshotOutputDirectory,
  storybookScreenshotViewport,
} from "./storybook-screenshots.constants";
import type {
  ScreenshotManifestStory,
  StorybookCatalog,
  StorybookCatalogEntry,
} from "./storybook-screenshots.types";

const catalog = JSON.parse(
  await readFile(
    new URL("../../node_modules/.storybook-static/index.json", import.meta.url),
    "utf8",
  ),
) as StorybookCatalog;
const stories = Object.values(catalog.entries)
  .filter((entry) => entry.type === "story")
  .sort((left, right) => left.id.localeCompare(right.id));

const storyPath = (storyId: string) =>
  `/iframe.html?id=${storyId}&viewMode=story`;
const isResponsiveScreen = (story: StorybookCatalogEntry) =>
  storybookResponsiveTitles.includes(story.title);
const screenshotFileNames = (story: StorybookCatalogEntry) => {
  const canonicalFileName = `${story.id}.png`;

  return isResponsiveScreen(story)
    ? [
        canonicalFileName,
        ...storybookResponsiveScreenshotWidths.map(
          (width) => `${story.id}-${width}.png`,
        ),
      ]
    : [canonicalFileName];
};

const waitForStory = async (page: Page) => {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const storybook = globalThis as typeof globalThis & {
          __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } };
        };

        return storybook.__STORYBOOK_PREVIEW__?.currentRender?.phase;
      }),
    )
    .toBe("finished");
  await expect(page.locator("#error-message")).toBeEmpty();
  await page.evaluate(async () => {
    await document.fonts.ready;
    const style = document.createElement("style");
    style.textContent =
      "*,*::before,*::after{animation:none!important;caret-color:transparent!important;transition:none!important}";
    document.head.append(style);
  });
};

const assertViewportFits = async (page: Page, width: number) => {
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
};

const assertPackCoverage = async (expectedFiles: Set<string>) => {
  const actualFiles = (await readdir(storybookScreenshotOutputDirectory))
    .filter((fileName) => fileName.endsWith(".png"))
    .sort();

  expect(actualFiles, "screenshot pack has stale or missing files").toEqual(
    [...expectedFiles].sort(),
  );
};

test("Admin Storybook screenshot pack соответствует built catalog", async ({
  page,
}) => {
  test.setTimeout(20 * 60_000);
  const runtimeFailures: string[] = [];
  let currentStoryId = "before-story-render";
  const reportRuntimeFailure = (message: string) => {
    const failure = `${currentStoryId}: ${message}`;

    if (!runtimeFailures.includes(failure)) runtimeFailures.push(failure);
  };

  page.on("console", (message) => {
    if (
      message.type() === "error" ||
      /Failed to resolve component:\s*v-/u.test(message.text())
    ) {
      reportRuntimeFailure(message.text());
    }
  });
  page.on("pageerror", (error) => reportRuntimeFailure(error.message));
  page.on("requestfailed", (request) =>
    reportRuntimeFailure(
      `${request.method()} ${request.url()}: ${request.failure()?.errorText}`,
    ),
  );

  await rm(storybookScreenshotOutputDirectory, {
    force: true,
    recursive: true,
  });
  await mkdir(storybookScreenshotOutputDirectory, { recursive: true });

  const expectedFiles = new Set<string>();
  const manifestStories: ScreenshotManifestStory[] = [];

  for (const story of stories) {
    currentStoryId = story.id;
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
      await page.goto(storyPath(story.id), { waitUntil: "domcontentloaded" });
      await waitForStory(page);
      await assertViewportFits(page, width);
      await page.screenshot({
        fullPage: true,
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

test("Admin Storybook screenshot pack не содержит stale files", async () => {
  const manifest = JSON.parse(
    await readFile(
      join(
        storybookScreenshotOutputDirectory,
        storybookScreenshotManifestFileName,
      ),
      "utf8",
    ),
  ) as {
    screenshotCount: number;
    stories: ScreenshotManifestStory[];
    storyCount: number;
  };
  const expectedFiles = manifest.stories.flatMap((story) => story.files);

  expect(manifest.storyCount).toBe(stories.length);
  expect(manifest.screenshotCount).toBe(expectedFiles.length);
  expect(expectedFiles).toEqual(stories.flatMap(screenshotFileNames));
  await assertPackCoverage(new Set(expectedFiles));
});
