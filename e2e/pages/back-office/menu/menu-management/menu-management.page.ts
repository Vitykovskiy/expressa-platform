import { expect, test, type Locator, type Page } from "@playwright/test";

import { CatalogListComponent } from "@pages/back-office/menu/menu-management/catalog-list/catalog-list.component";
import { CategoryEditorComponent } from "@pages/back-office/menu/menu-management/category-editor/category-editor.component";
import { ModifierAssignmentComponent } from "@pages/back-office/menu/menu-management/modifier-assignment/modifier-assignment.component";
import { ModifierGroupEditorComponent } from "@pages/back-office/menu/menu-management/modifier-group-editor/modifier-group-editor.component";
import { ProductEditorComponent } from "@pages/back-office/menu/menu-management/product-editor/product-editor.component";

export class MenuManagementPage {
  public readonly assignments: ModifierAssignmentComponent;
  public readonly catalog: CatalogListComponent;
  public readonly categoryEditor: CategoryEditorComponent;
  public readonly productEditor: ProductEditorComponent;
  public readonly modifierGroupEditor: ModifierGroupEditorComponent;

  private readonly menuButton: Locator;
  private readonly managementButton: Locator;
  private readonly addCategoryButton: Locator;

  constructor(page: Page) {
    this.assignments = new ModifierAssignmentComponent(page);
    this.catalog = new CatalogListComponent(page);
    this.categoryEditor = new CategoryEditorComponent(page);
    this.productEditor = new ProductEditorComponent(page);
    this.modifierGroupEditor = new ModifierGroupEditorComponent(page);
    this.menuButton = page.getByRole("button", { name: "Меню", exact: true });
    this.managementButton = page.getByRole("button", {
      name: "Управление меню",
      exact: true,
    });
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

  async ensureManagementExpanded(): Promise<void> {
    await test.step("Открыть управление меню", async () => {
      if (
        (await this.managementButton.getAttribute("aria-expanded")) === "true"
      ) {
        await expect(
          this.managementButton,
          "Управление меню открыто.",
        ).toHaveAttribute("aria-expanded", "true");
        return;
      }

      await expect(
        this.managementButton,
        "Управление меню доступно.",
      ).toBeEnabled();
      await this.managementButton.click();
      await expect(
        this.managementButton,
        "Управление меню открыто.",
      ).toHaveAttribute("aria-expanded", "true");
    });
  }
}
