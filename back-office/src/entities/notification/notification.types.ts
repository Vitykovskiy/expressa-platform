import type { NativePushProof } from "../../shared/browser/web-push.types";

export interface PushAssociation {
  association: "none" | "current" | "other";
  version: string | null;
}
export type NotificationAction = "enable" | "disable";
export type NotificationPhase =
  "idle" | "reading" | "preparing" | "sending" | "unknown";
export interface NotificationOperation {
  identity: string;
  epoch: number;
  action: NotificationAction;
  proof: NativePushProof | null;
  version: string | null;
  sent: boolean;
  unknown: boolean;
  inspected: PushAssociation | null;
}
export interface NotificationView {
  message: string;
  context: string;
  recovery: string;
  primary: "enable" | "disable" | "read" | "finish" | null;
  primaryLabel: string;
  pending: boolean;
  indicator: string;
}
