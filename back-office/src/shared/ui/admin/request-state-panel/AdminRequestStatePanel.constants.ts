import type { AdminRequestStatePanelProps } from "./AdminRequestStatePanel.types";

export const ADMIN_REQUEST_STATE_PANEL_DEFAULTS = {
  code: "",
  pending: false,
  pendingLabel: "Повторяем…",
  requestId: "",
} satisfies Required<
  Pick<
    AdminRequestStatePanelProps,
    "code" | "pending" | "pendingLabel" | "requestId"
  >
>;
