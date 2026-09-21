import type { ApiClient } from "./client";

export type PushApi = {
  associateSubscription(
    accessToken: string,
    request: PushAssociationRequest,
  ): Promise<PushAssociationResponse>;
  deleteAssociation(
    accessToken: string,
    request: PushAssociationDeleteRequest,
  ): Promise<void>;
  getPublicKey(accessToken: string): Promise<string>;
  inspectSubscription(
    accessToken: string,
    subscription: PushSubscriptionRequest,
  ): Promise<PushSubscriptionInspection>;
};

export type PushApiClient = Pick<ApiClient, "request">;

export type PushSubscriptionRequest = {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
};

export type PushPublicKeyResponse = {
  publicKey: string;
};

export type PushSubscriptionAssociation = "current" | "none" | "other";

export type PushSubscriptionInspection = {
  association: PushSubscriptionAssociation;
  version: string | null;
};

export type PushAssociationRequest = {
  action: "enable" | "transfer";
  expectedVersion: string | null;
  subscription: PushSubscriptionRequest;
};

export type PushAssociationResponse = {
  association: "current";
  version: string;
};

export type PushAssociationDeleteRequest = {
  expectedVersion: string;
  subscription: PushSubscriptionRequest;
};
