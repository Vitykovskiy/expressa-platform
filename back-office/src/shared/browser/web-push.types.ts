export interface NativePushProof {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}
export interface NativePushOwner {
  scriptURL: string;
  scope: string;
}
export interface NativePushState {
  registration: ServiceWorkerRegistration | null;
  subscription: PushSubscription | null;
  proof: NativePushProof | null;
  permission: NotificationPermission;
}
