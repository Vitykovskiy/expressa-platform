import type { PushSubscriptionRepository } from "../application/push-notifications.types";
import type { PushAssociationUnitOfWork } from "../application/push-association.types";

import type { Pool, PoolClient } from "pg";

export type PostgresPushSubscriptionRepositoryDependencies = { pool: Pool };
export type DatabaseRow = Record<string, unknown>;
export type PushQueryable = Pick<PoolClient, "query">;

export type PushPorts = PushSubscriptionRepository & PushAssociationUnitOfWork;
