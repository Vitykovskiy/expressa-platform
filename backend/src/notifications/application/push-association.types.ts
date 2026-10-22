import type {
  PushSubscription,
  PushSubscriptionCommand,
  PushSubscriptionRepository,
} from "./push-notifications.types";

export type PushAssociationActor = {
  userId: string;
  sessionId: string;
  role: "customer" | "barista" | "administrator";
};
export interface PushAssociationTransaction {
  findByEndpoint(endpoint: string): Promise<PushSubscription | null>;
  createAssociation(command: PushSubscriptionCommand): Promise<string | null>;
  transferAssociation(
    subscription: PushSubscription,
    userId: string,
    expectedVersion: string,
  ): Promise<string | null>;
  deleteAssociation(subscription: PushSubscription): Promise<boolean>;
}
export interface PushAssociationUnitOfWork {
  run<Result>(
    actor: PushAssociationActor,
    endpoint: string,
    operation: (repository: PushAssociationTransaction) => Promise<Result>,
  ): Promise<Result>;
}
export type PushAssociationRepository = PushSubscriptionRepository &
  Partial<PushAssociationUnitOfWork>;
