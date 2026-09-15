export type RefreshTokenParts = {
  sessionId: string;
  secret: string;
};

export type LogoutPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};
