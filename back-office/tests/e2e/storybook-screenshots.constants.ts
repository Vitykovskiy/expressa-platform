import { resolve } from "node:path";

export const storybookScreenshotManifestFileName = "manifest.json";
export const storybookScreenshotOutputDirectory = resolve(
  process.cwd(),
  "../docs/95-testing/storybook-screenshots/back-office",
);
export const storybookScreenshotViewport = { height: 900, width: 1440 };
export const storybookResponsiveScreenshotWidths = [390, 767, 768, 1280];
export const storybookResponsiveTitles = [
  "Admin/Auth/AuthScreen",
  "Admin/Availability/AvailabilityScreen",
  "Admin/Orders/Screen",
  "Admin/Settings/SettingsScreen",
  "Admin/Shell",
  "Admin/Users/UsersScreen",
];
