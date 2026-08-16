export type PushSubscription = { id: string; userId: string; endpoint: string; p256dh: string; auth: string };
export type PushSubscriptionCommand = Omit<PushSubscription, 'id'>;
export type PushRecipient = 'customer' | 'staff';
export type OrderPush = { recipient: PushRecipient; orderId: string; number: string; stage: 'CREATED' | 'ACCEPTED' | 'READY' | 'ISSUED'; customerId: string };

export interface PushSubscriptionRepository {
  upsert(command: PushSubscriptionCommand): Promise<void>;
  delete(userId: string, endpoint: string): Promise<void>;
  findForUser(userId: string): Promise<readonly PushSubscription[]>;
  findForStaff(): Promise<readonly PushSubscription[]>;
}

export interface PushSender {
  send(subscription: PushSubscription, notification: { title: string; body: string; orderId: string }): Promise<void>;
}
