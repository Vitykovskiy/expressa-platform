import type { ConfiguredCartItemDraft } from "@/entities/customer/model/customer.types";
import type { PublicMenu } from "@/shared/api/public-menu.api";

export type MenuFlowScreen =
  | { id: "root" }
  | { id: "category"; categoryId: string }
  | { id: "product"; categoryId: string; productId: string };

export type MenuShellTarget =
  { id: "root" } | { id: "category"; categoryId: string };

export interface MenuShellCommand {
  requestId: number;
  target: MenuShellTarget;
}

export interface MenuFlowProps {
  menu: PublicMenu;
  menuShellCommand?: MenuShellCommand | null;
}

export type MenuFlowEmits = {
  add: [item: ConfiguredCartItemDraft];
  changeLevel: [level: MenuFlowScreen["id"]];
  menuScreenChange: [screen: MenuFlowScreen];
  menuShellCommandAck: [requestId: number];
};
