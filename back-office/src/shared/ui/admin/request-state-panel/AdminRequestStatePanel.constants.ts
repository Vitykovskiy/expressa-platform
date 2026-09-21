import type { AdminRequestStatePanelProps } from "./AdminRequestStatePanel.types";

export const ADMIN_REQUEST_STATE_PANEL_DEFAULTS = {
  announcementMode: "none",
  code: "",
  disclosureLabel: "Для поддержки",
  focusOnAppear: false,
  pending: false,
  pendingLabel: "Повторяем…",
  requestId: "",
} satisfies Required<
  Pick<
    AdminRequestStatePanelProps,
    | "announcementMode"
    | "code"
    | "disclosureLabel"
    | "focusOnAppear"
    | "pending"
    | "pendingLabel"
    | "requestId"
  >
>;
