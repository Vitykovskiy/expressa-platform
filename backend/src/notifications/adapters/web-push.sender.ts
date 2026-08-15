import webpush from 'web-push';
import type { PushSender, PushSubscription } from '../application/push-notifications.types';
import type { WebPushSenderDependencies } from './web-push.sender.types';

export class WebPushSender implements PushSender {
  constructor(private readonly dependencies: WebPushSenderDependencies) {
    webpush.setVapidDetails(dependencies.subject, dependencies.publicKey, dependencies.privateKey);
  }

  async send(subscription: PushSubscription, notification: { title: string; body: string; orderId: string }): Promise<void> {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(notification),
    );
  }
}
