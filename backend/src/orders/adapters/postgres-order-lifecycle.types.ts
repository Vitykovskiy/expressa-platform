import type { OrderReadRepository } from "../application/order-lifecycle.types";
import type { OrderTransitionUnitOfWork } from "../application/order-lifecycle.types";
import type { SourceOrderUnitOfWork } from "../application/source-order-actions.types";

import type { Pool, PoolClient } from "pg";

export type DatabaseRow = Record<string, unknown>;
export type PostgresOrderLifecycleDependencies = { pool: Pool };
export type TransactionClient = PoolClient;

export type Queryable = Pick<TransactionClient, "query">;

export type OrderPorts = OrderReadRepository &
  OrderTransitionUnitOfWork &
  SourceOrderUnitOfWork;
