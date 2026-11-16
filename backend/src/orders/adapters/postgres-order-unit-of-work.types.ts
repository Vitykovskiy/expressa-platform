import type { OrderUnitOfWork } from "../application/order-unit-of-work.types";
import type { PickupSlotsReader } from "../application/pickup-slots.types";

import type { Pool, PoolClient } from "pg";

export type DatabaseRow = Record<string, unknown>;

export type PostgresOrderUnitOfWorkDependencies = {
  pool: Pool;
};

export type TransactionClient = PoolClient;

export type OrderPorts = OrderUnitOfWork & PickupSlotsReader;
