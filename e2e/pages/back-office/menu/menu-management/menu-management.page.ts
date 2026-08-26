import { expect, test, type Locator, type Page } from "@playwright/test";

import { CatalogListComponent } from "./catalog-list/catalog-list.component";
import { CategoryEditorComponent } from "./category-editor/category-editor.component";
import { ModifierAssignmentComponent } from "./modifier-assignment/modifier-assignment.component";
import { ModifierGroupEditorComponent } from "./modifier-group-editor/modifier-group-editor.component";
import { ProductEditorComponent } from "./product-editor/product-editor.component";

export class MenuManagementPage {
  public readonly assignments: ModifierAssignmentComponent;
  public readonly catalog: CatalogListComponent;
  public readonly categoryEditor: CategoryEditorComponent;
  public readonly productEditor: ProductEditorComponent;
  public readonly modifierGroupEditor: ModifierGroupEditorComponent;

  private readonly menuButton: Locator;
  private readonly addCategoryButton: Locator;

  constructor(page: Page) {
    this.assignments = new ModifierAssignmentComponent(page);
    this.catalog = new CatalogListComponent(page);
    this.categoryEditor = new CategoryEditorComponent(page);
    this.productEditor = new ProductEditorComponent(page);
    this.modifierGroupEditor = new ModifierGroupEditorComponent(page);
    this.menuButton = page.getByRole("button", { name: "Меню", exact: true });
    this.addCategoryButton = page.getByRole("button", {
      name: "Добавить группу",
      exact: true,
    });
  }

  async open(): Promise<void> {
    await test.step("Открыть управление меню", async () => {
      await expect(this.menuButton, "Раздел «Меню» доступен.").toBeEnabled();
      await this.menuButton.click();
      await this.waitReady();
    });
  }

  async waitReady(): Promise<void> {
    await expect(
      this.addCategoryButton,
      "Рабочее пространство меню показано.",
    ).toBeVisible();
  }
}
