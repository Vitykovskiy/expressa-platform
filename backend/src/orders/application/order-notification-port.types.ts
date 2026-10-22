export const orderNotificationPort = Symbol("orderNotificationPort");

export type OrderNotificationCommand =
  | {
      recipient: "staff";
      orderId: string;
      number: string;
      stage: "CREATED";
      customerId: string;
    }
  | {
      recipient: "customer";
      orderId: string;
      number: string;
      stage: "ACCEPTED" | "READY" | "ISSUED" | "REJECTED";
      rejectionReason?: string;
      customerId: string;
    };

export interface OrderNotificationPort {
  execute(notification: OrderNotificationCommand): Promise<void>;
}
