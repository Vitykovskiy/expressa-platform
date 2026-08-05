import { resolve } from "node:path";

export const storybookScreenshotViewport = {
  height: 844,
  width: 390,
};

export const storybookResponsiveScreenshotWidths = [
  479, 480, 768, 1023, 1024, 1280,
];

export const storybookScreenshotOutputDirectory = resolve(
  process.cwd(),
  "../docs/95-testing/storybook-screenshots/front-office",
);

export const storybookScreenshotManifestFileName = "manifest.json";

export const storybookResponsiveTitles = [
  "Customer/Screens/",
  "Customer/Journeys/",
];
