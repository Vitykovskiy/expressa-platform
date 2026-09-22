import type {
  OperationContext,
  OperationOutcomeKey,
  OperationPort,
  OperationRecovery,
  OperationRecoveryInvocation,
  OperationResult,
  OperationVisibility,
} from "./operation.types";

let operationPort: OperationPort | null = null;

export function setOperationPort(port: OperationPort): void {
  operationPort = port;
}

export function getOperationPort(): OperationPort {
  if (operationPort === null)
    throw new Error("Operation port is not configured.");
  return operationPort;
}

export type {
  OperationContext,
  OperationOutcomeKey,
  OperationRecovery,
  OperationRecoveryInvocation,
  OperationResult,
  OperationVisibility,
};
