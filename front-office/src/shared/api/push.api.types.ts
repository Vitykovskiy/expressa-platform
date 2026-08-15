import type { ApiClient } from "./client";

export type PushApi = {
  deleteSubscription(
    accessToken: string,
    subscription: PushSubscriptionRequest,
  ): Promise<void>;
  getPublicKey(accessToken: string): Promise<string>;
  saveSubscription(
    accessToken: string,
    subscription: PushSubscriptionRequest,
  ): Promise<void>;
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
