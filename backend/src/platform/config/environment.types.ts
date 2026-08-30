import type { deliveryEnvironments } from "./environment.constants";

export type DeliveryEnvironment = (typeof deliveryEnvironments)[number];
