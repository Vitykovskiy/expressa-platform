import type {
  PushAssociation,
  PushSubscriptionCommand,
  PushSubscriptionRepository,
} from "./push-notifications.types";
import {
  hasPushSubscriptionProof,
  isValidPushSubscriptionProof,
} from "../domain/push-subscription-proof";
import { pushAssociationConflictCode } from "./manage-push-subscription.use-case.constants";

export class PushAssociationConflictError extends Error {
  readonly code = pushAssociationConflictCode;
}

export class ManagePushSubscriptionUseCase {
  constructor(private readonly repository: PushSubscriptionRepository) {}
  upsert(command: PushSubscriptionCommand): Promise<void> {
    return this.repository.upsert(command);
  }
  delete(userId: string, endpoint: string): Promise<void> {
    return this.repository.delete(userId, endpoint);
  }

  async inspect(
    userId: string,
    subscription: PushSubscriptionCommand,
  ): Promise<PushAssociation> {
    if (!isValidPushSubscriptionProof(subscription))
      return { association: "none", version: null };
    const stored = await this.repository.findByEndpoint(subscription.endpoint);
    if (!stored || !hasPushSubscriptionProof(stored, subscription))
      return { association: "none", version: null };
    return {
      association: stored.userId === userId ? "current" : "other",
      version: stored.associationVersion,
    };
  }

  async associate(
    userId: string,
    subscription: PushSubscriptionCommand,
    action: "enable" | "transfer",
    expectedVersion: string | null,
  ): Promise<{ association: "current"; version: string }> {
    if (!isValidPushSubscriptionProof(subscription))
      throw new PushAssociationConflictError();
    if (action === "enable") {
      if (expectedVersion !== null) throw new PushAssociationConflictError();
      const inserted = await this.repository.createAssociation({
        ...subscription,
        userId,
      });
      if (inserted !== null)
        return { association: "current", version: inserted };
      const stored = await this.repository.findByEndpoint(
        subscription.endpoint,
      );
      if (
        stored?.userId === userId &&
        hasPushSubscriptionProof(stored, subscription)
      )
        return { association: "current", version: stored.associationVersion };
      throw new PushAssociationConflictError();
    }

    if (expectedVersion === null) throw new PushAssociationConflictError();
    const stored = await this.repository.findByEndpoint(subscription.endpoint);
    if (
      !stored ||
      !hasPushSubscriptionProof(stored, subscription) ||
      stored.associationVersion !== expectedVersion
    )
      throw new PushAssociationConflictError();
    if (stored.userId === userId)
      return { association: "current", version: stored.associationVersion };
    if (stored.ownerRole !== "customer")
      throw new PushAssociationConflictError();
    const version = await this.repository.transferAssociation(
      stored,
      userId,
      expectedVersion,
    );
    if (version === null) throw new PushAssociationConflictError();
    return { association: "current", version };
  }

  async deleteAssociation(
    userId: string,
    subscription: PushSubscriptionCommand,
    expectedVersion: string,
  ): Promise<void> {
    if (!isValidPushSubscriptionProof(subscription))
      throw new PushAssociationConflictError();
    const stored = await this.repository.findByEndpoint(subscription.endpoint);
    if (!stored) return;
    if (
      stored.userId !== userId ||
      stored.associationVersion !== expectedVersion ||
      !hasPushSubscriptionProof(stored, subscription)
    )
      throw new PushAssociationConflictError();
    if (!(await this.repository.deleteAssociation(stored)))
      throw new PushAssociationConflictError();
  }
}
