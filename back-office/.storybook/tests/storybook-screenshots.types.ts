export type StorybookCatalogEntry = {
  id: string;
  title: string;
  type: string;
};

export type StorybookCatalog = {
  entries: Record<string, StorybookCatalogEntry>;
};

export type ScreenshotManifestStory = {
  files: string[];
  id: string;
  responsive: boolean;
  title: string;
};
