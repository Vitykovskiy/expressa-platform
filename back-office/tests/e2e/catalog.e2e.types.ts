import type { Page } from "@playwright/test";

export type BrowserIssue = {
  source: "console" | "page" | "request" | "response";
  text: string;
};

export type CatalogPage = Page;

export type CatalogProductResponse = {
  id: string;
  variants: readonly CatalogProductVariantResponse[];
};

export type CatalogProductVariantResponse = {
  id: string;
  isAvailable: boolean;
  price: number;
  size: "S" | "M" | "L";
  sortOrder: number;
};
