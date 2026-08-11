import type { ConfiguredCartItemDraft } from "@/entities/customer/model/customer.types";
import type { PublicMenu } from "@/shared/api/public-menu.api";

export type MenuFlowScreen =
  | { id: "root" }
  | { id: "category"; categoryId: string }
  | { id: "product"; categoryId: string; productId: string };

export interface MenuFlowProps {
  menu: PublicMenu;
}

export type MenuFlowEmits = {
  add: [item: ConfiguredCartItemDraft];
  changeLevel: [level: MenuFlowScreen["id"]];
};
