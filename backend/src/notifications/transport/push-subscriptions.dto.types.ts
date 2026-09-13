export type PushSubscriptionDto = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};
export type PushPublicKeyDto = { publicKey: string };
export type PushAssociationAction = "enable" | "transfer";
export type PushAssociationRequestDto = {
  subscription: PushSubscriptionDto;
  action: PushAssociationAction;
  expectedVersion: string | null;
};
export type PushAssociationResponseDto = {
  association: "current";
  version: string;
};
export type PushAssociationDeleteRequestDto = {
  subscription: PushSubscriptionDto;
  expectedVersion: string;
};
export type PushSubscriptionInspectionDto = {
  association: "none" | "current" | "other";
  version: string | null;
};
