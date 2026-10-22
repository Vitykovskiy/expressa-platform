import type {
  PushAssociationActor,
  PushAssociationRepository,
  PushAssociationTransaction,
} from "./push-association.types";
import type {
  PushAssociation,
  PushSubscriptionCommand,
} from "./push-notifications.types";
import {
  hasPushSubscriptionProof,
  isValidPushSubscriptionProof,
} from "../domain/push-subscription-proof";
import { pushAssociationConflictCode } from "./manage-push-subscription.use-case.constants";

export class PushAssociationConflictError extends Error {
  readonly code = pushAssociationConflictCode;
}

export class PushAssociationUnauthorizedError extends Error {}
export class PushAssociationAccessDeniedError extends Error {}

export class ManagePushSubscriptionUseCase {
  constructor(private readonly repository: PushAssociationRepository) {}

  async inspect(
    userId: string,
    subscription: PushSubscriptionCommand,
    actor?: PushAssociationActor,
  ): Promise<PushAssociation> {
    return this.withAuthorization(
      userId,
      subscription.endpoint,
      actor,
      async (repository) => {
        if (!isValidPushSubscriptionProof(subscription)) {
          return { association: "none", version: null };
        }
        const stored = await repository.findByEndpoint(subscription.endpoint);
        if (
          stored === null ||
          !hasPushSubscriptionProof(stored, subscription)
        ) {
          return { association: "none", version: null };
        }
        return {
          association: stored.userId === userId ? "current" : "other",
          version: stored.associationVersion,
        };
      },
    );
  }

  async associate(
    userId: string,
    subscription: PushSubscriptionCommand,
    action: "enable" | "transfer",
    expectedVersion: string | null,
    actor?: PushAssociationActor,
  ): Promise<{ association: "current"; version: string }> {
    if (actor?.role !== "customer") {
      throw actor === undefined
        ? new PushAssociationUnauthorizedError()
        : new PushAssociationAccessDeniedError();
    }
    return this.withAuthorization(
      userId,
      subscription.endpoint,
      actor,
      (repository) =>
        this.associateSubscription(
          repository,
          userId,
          subscription,
          action,
          expectedVersion,
          true,
        ),
    );
  }

  async associateForBarista(
    userId: string,
    subscription: PushSubscriptionCommand,
    action: "enable" | "transfer",
    expectedVersion: string | null,
    actor?: PushAssociationActor,
  ): Promise<{ association: "current"; version: string }> {
    if (actor?.role !== "barista") {
      throw actor === undefined
        ? new PushAssociationUnauthorizedError()
        : new PushAssociationAccessDeniedError();
    }
    return this.withAuthorization(
      userId,
      subscription.endpoint,
      actor,
      (repository) =>
        this.associateSubscription(
          repository,
          userId,
          subscription,
          action,
          expectedVersion,
          false,
        ),
    );
  }

  private async associateSubscription(
    repository: PushAssociationTransaction,
    userId: string,
    subscription: PushSubscriptionCommand,
    action: "enable" | "transfer",
    expectedVersion: string | null,
    allowForeignTransfer: boolean,
  ): Promise<{ association: "current"; version: string }> {
    if (!isValidPushSubscriptionProof(subscription)) {
      throw new PushAssociationConflictError();
    }
    if (action === "enable") {
      if (expectedVersion !== null) {
        throw new PushAssociationConflictError();
      }
      const inserted = await repository.createAssociation({
        ...subscription,
        userId,
      });
      if (inserted !== null) {
        return { association: "current", version: inserted };
      }
      const stored = await repository.findByEndpoint(subscription.endpoint);
      if (
        stored?.userId === userId &&
        hasPushSubscriptionProof(stored, subscription)
      ) {
        return { association: "current", version: stored.associationVersion };
      }
      throw new PushAssociationConflictError();
    }

    if (expectedVersion === null) {
      throw new PushAssociationConflictError();
    }
    const stored = await repository.findByEndpoint(subscription.endpoint);
    if (
      !stored ||
      !hasPushSubscriptionProof(stored, subscription) ||
      stored.associationVersion !== expectedVersion
    ) {
      throw new PushAssociationConflictError();
    }
    if (stored.userId === userId) {
      return { association: "current", version: stored.associationVersion };
    }
    if (!allowForeignTransfer || stored.ownerRole !== "customer") {
      throw new PushAssociationConflictError();
    }
    const version = await repository.transferAssociation(
      stored,
      userId,
      expectedVersion,
    );
    if (version === null) {
      throw new PushAssociationConflictError();
    }
    return { association: "current", version };
  }

  async deleteAssociation(
    userId: string,
    subscription: PushSubscriptionCommand,
    expectedVersion: string,
    actor?: PushAssociationActor,
  ): Promise<void> {
    return this.withAuthorization(
      userId,
      subscription.endpoint,
      actor,
      async (repository) => {
        if (!isValidPushSubscriptionProof(subscription)) {
          throw new PushAssociationConflictError();
        }
        const stored = await repository.findByEndpoint(subscription.endpoint);
        if (stored === null) {
          return;
        }
        if (
          stored.userId !== userId ||
          stored.associationVersion !== expectedVersion ||
          !hasPushSubscriptionProof(stored, subscription)
        ) {
          throw new PushAssociationConflictError();
        }
        if (!(await repository.deleteAssociation(stored))) {
          throw new PushAssociationConflictError();
        }
      },
    );
  }

  private withAuthorization<Result>(
    userId: string,
    endpoint: string,
    actor: PushAssociationActor | undefined,
    operation: (repository: PushAssociationTransaction) => Promise<Result>,
  ): Promise<Result> {
    if (
      actor === undefined ||
      actor.userId !== userId ||
      actor.sessionId.trim() === ""
    ) {
      throw new PushAssociationUnauthorizedError();
    }
    if (actor.role !== "customer" && actor.role !== "barista") {
      throw new PushAssociationAccessDeniedError();
    }
    if (this.repository.run === undefined) {
      throw new Error("Push association transaction is unavailable");
    }
    return this.repository.run(actor, endpoint, operation);
  }
}
