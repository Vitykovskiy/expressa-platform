import type { OrderPush, PushSender, PushSubscriptionRepository } from './push-notifications.types';

export class SendOrderPushUseCase {
  constructor(private readonly repository: PushSubscriptionRepository, private readonly sender: PushSender) {}

  async execute(order: OrderPush): Promise<void> {
    const subscriptions = order.recipient === 'staff'
      ? await this.repository.findForStaff()
      : await this.repository.findForUser(order.customerId);
    const notification = toNotification(order);
    await Promise.all(subscriptions.map(async (subscription) => {
      try {
        await this.sender.send(subscription, notification);
      } catch (error) {
        if (isInvalidSubscription(error)) await this.repository.delete(subscription.userId, subscription.endpoint);
      }
    }));
  }
}

function toNotification(order: OrderPush): { title: string; body: string; orderId: string } {
  if (order.recipient === 'staff') return { title: 'Новый заказ', body: `Заказ ${order.number} ожидает принятия`, orderId: order.orderId };
  const body = order.stage === 'ACCEPTED' ? 'Заказ принят' : order.stage === 'READY' ? 'Заказ готов' : 'Заказ выдан';
  return { title: `Заказ ${order.number}`, body, orderId: order.orderId };
}

function isInvalidSubscription(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'statusCode' in error
    && ((error as { statusCode?: unknown }).statusCode === 404 || (error as { statusCode?: unknown }).statusCode === 410);
}
