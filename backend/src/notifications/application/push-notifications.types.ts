export type PushSubscription = {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  associationVersion: string;
  ownerRole?: "customer" | "barista" | "administrator";
};
export type PushSubscriptionCommand = Omit<
  PushSubscription,
  "id" | "associationVersion" | "ownerRole"
>;
export type PushAssociation = {
  association: "none" | "current" | "other";
  version: string | null;
};
export type PushRecipient = "customer" | "staff";
export type OrderPush = {
  recipient: PushRecipient;
  orderId: string;
  number: string;
  stage: "CREATED" | "ACCEPTED" | "READY" | "ISSUED";
  customerId: string;
};

export interface PushSubscriptionRepository {
  findByEndpoint(endpoint: string): Promise<PushSubscription | null>;
  createAssociation(command: PushSubscriptionCommand): Promise<string | null>;
  transferAssociation(
    subscription: PushSubscription,
    userId: string,
    expectedVersion: string,
  ): Promise<string | null>;
  deleteAssociation(subscription: PushSubscription): Promise<boolean>;
  deleteSnapshot(subscription: PushSubscription): Promise<void>;
  findForUser(userId: string): Promise<readonly PushSubscription[]>;
  findForStaff(): Promise<readonly PushSubscription[]>;
}

export interface PushSender {
  send(
    subscription: PushSubscription,
    notification: { title: string; body: string; orderId: string },
  ): Promise<void>;
}
