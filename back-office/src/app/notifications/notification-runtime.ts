import { shallowRef } from "vue";
import type {
  ApiRequestDescriptor,
  ApiRequestOutcome,
  ApiRequestReporting,
} from "../../shared/api/client.types";
import type {
  OperationContext,
  OperationOutcomeKey,
  OperationRecovery,
  OperationResult,
  OperationVisibility,
} from "../../shared/lib/operations/operation.types";
import { classifyError } from "./error-taxonomy";
import {
  outcomeMessages,
  requestSuccessMessages,
} from "./error-taxonomy.constants";
import {
  defaultNotificationVisibility,
  narrowNotificationViewport,
  notificationLifetimeMs,
  notificationTickMs,
} from "./notification-runtime.constants";
import type {
  CapturedContext,
  NotificationEntry,
  NotificationRuntime,
  OperationGeneration,
  RecoveryRegistration,
  NotificationBatch,
  OperationLifetime,
} from "./notification-runtime.types";

export function createNotificationRuntime(): NotificationRuntime {
  const entries = shallowRef<readonly NotificationEntry[]>([]);
  const batches = new Map<string, NotificationBatch>();
  const lifetimes = new Map<string, OperationLifetime>();
  const generations = new Map<string, OperationGeneration>();
  const registrations = new Map<string, RecoveryRegistration>();
  const bindings = new Map<string, string>();
  const listeners = new Set<() => void>();
  let visibility = defaultNotificationVisibility;
  let clock: ReturnType<typeof setInterval> | null = null;
  let lastTick = performance.now();
  const operationIdentity = (
    context: Pick<
      OperationContext,
      "epoch" | "operationKey" | "resourceKey" | "ownerIdentity"
    >,
  ) =>
    JSON.stringify([
      context.epoch,
      context.operationKey,
      context.resourceKey,
      context.ownerIdentity ?? null,
    ]);
  const visible = () =>
    entries.value.slice(
      0,
      visibility.stackFits &&
        visibility.viewportWidth >= narrowNotificationViewport
        ? 3
        : 1,
    );
  const lifetimeFor = (epoch: string) => {
    let lifetime = lifetimes.get(epoch);
    if (lifetime === undefined || !lifetime.active) {
      lifetime = { active: true, requests: 0, runs: 0 };
      lifetimes.set(epoch, lifetime);
    }
    return lifetime;
  };
  const capture = (
    context: OperationContext,
    generation: OperationGeneration | null = null,
  ): CapturedContext => ({
    ...context,
    fieldTargets:
      context.fieldTargets === undefined
        ? undefined
        : Object.freeze(
            Object.fromEntries(
              Object.entries(context.fieldTargets).map(([key, target]) => [
                key,
                Object.freeze({ path: target.path }),
              ]),
            ),
          ),
    lifetime: lifetimeFor(context.epoch),
    generation,
    issuedGeneration: generation?.latestIssued ?? null,
  });
  const current = (context: CapturedContext) =>
    context.lifetime.active &&
    context.ownerIsActive?.() !== false &&
    (context.generation === null ||
      context.generation.latestIssued === context.issuedGeneration);
  const cleanupLifetime = (epoch: string, lifetime: OperationLifetime) => {
    if (lifetime.requests !== 0 || lifetime.runs !== 0) return;
    if (
      [...batches.values()].some((batch) => batch.context.lifetime === lifetime)
    )
      return;
    if (
      [...registrations.values()].some(
        (registration) => registration.context.lifetime === lifetime,
      )
    )
      return;
    if (lifetimes.get(epoch) === lifetime) lifetimes.delete(epoch);
  };
  const updateEntry = (id: string, update: Partial<NotificationEntry>) => {
    entries.value = entries.value.map((entry) =>
      entry.id === id ? { ...entry, ...update } : entry,
    );
  };
  const emit = () => {
    if (entries.value.length === 0) {
      if (clock !== null) clearInterval(clock);
      clock = null;
    } else if (clock === null) {
      lastTick = performance.now();
      clock = setInterval(tick, notificationTickMs);
    }
    listeners.forEach((listener) => listener());
  };
  const remove = (id: string) => {
    const batch = batches.get(id);
    entries.value = entries.value.filter((entry) => entry.id !== id);
    batches.delete(id);
    bindings.delete(id);
    if (batch !== undefined)
      cleanupLifetime(batch.context.epoch, batch.context.lifetime);
  };
  const retireAction = (id: string) => {
    bindings.delete(id);
    updateEntry(id, { actionLabel: undefined, busy: false });
  };
  const matchesTarget = (
    context: CapturedContext,
    descriptor?: ApiRequestDescriptor,
  ) =>
    context.requestTarget === undefined ||
    (context.requestTarget.operationKey === descriptor?.operationKey &&
      context.requestTarget.resourceKey === descriptor.resourceKey);
  const bind = (id: string, context: CapturedContext) => {
    if (!current(context)) return;
    const registration = [...registrations.values()]
      .reverse()
      .find(
        (candidate) =>
          candidate.active &&
          current(candidate.context) &&
          matchesTarget(candidate.context, batches.get(id)?.descriptor) &&
          operationIdentity(candidate.context) === operationIdentity(context),
      );
    if (registration === undefined) return;
    bindings.set(id, registration.id);
    updateEntry(id, { actionLabel: registration.recovery.actionLabel });
  };
  const settleTime = () => {
    const timestamp = performance.now();
    const elapsed = Math.max(0, timestamp - lastTick);
    lastTick = timestamp;
    const visibleIds = new Set(visible().map((entry) => entry.id));
    for (const entry of entries.value) {
      const batch = batches.get(entry.id);
      if (batch !== undefined && visibleIds.has(entry.id)) batch.served = false;
      if (
        batch === undefined ||
        visibility.hidden ||
        !visibleIds.has(entry.id) ||
        visibility.hoveredId === entry.id ||
        entry.busy
      )
        continue;
      batch.elapsed += elapsed;
      batch.exposed = true;
    }
  };
  const tick = () => {
    settleTime();
    let changed = false;
    for (const entry of [...entries.value]) {
      const batch = batches.get(entry.id);
      if (
        batch === undefined ||
        batch.elapsed < notificationLifetimeMs ||
        visibility.hidden ||
        visibility.hoveredId === entry.id ||
        entry.busy
      )
        continue;
      changed = true;
      if (batch.persistent && !batch.resolved) {
        batch.elapsed = 0;
        batch.served = true;
        entries.value = [
          ...entries.value.filter((candidate) => candidate.id !== entry.id),
          entry,
        ];
      } else remove(entry.id);
    }
    if (changed) emit();
  };
  const append = (
    key: string,
    entry: Omit<NotificationEntry, "id" | "busy">,
    context: CapturedContext,
    requestIdentity: string | null,
    persistent: boolean,
    descriptor?: ApiRequestDescriptor,
    retirementMessage?: string,
  ) => {
    settleTime();
    const equivalent = [...batches.values()].find(
      (batch) => batch.key === key && !batch.resolved,
    );
    if (equivalent !== undefined) {
      const inCurrentService = visible().some(
        (entry) => entry.id === equivalent.id,
      );
      const protectedEntry =
        visibility.hoveredId === equivalent.id ||
        entries.value.some((entry) => entry.id === equivalent.id && entry.busy);
      if (equivalent.served && !inCurrentService && !protectedEntry) {
        equivalent.served = false;
        equivalent.elapsed = 0;
        const existing = entries.value.find(
          (entry) => entry.id === equivalent.id,
        );
        if (existing !== undefined)
          entries.value = [
            ...entries.value.filter((entry) => entry.id !== existing.id),
            existing,
          ];
      }
      equivalent.count = Math.min(
        Number.MAX_SAFE_INTEGER,
        equivalent.count + 1,
      );
      updateEntry(equivalent.id, {
        accounting:
          equivalent.count === Number.MAX_SAFE_INTEGER
            ? "Много операций"
            : operationCountLabel(equivalent.count),
      });
      emit();
      return;
    }
    const id = crypto.randomUUID();
    batches.set(id, {
      id,
      key,
      context,
      requestIdentity,
      descriptor,
      actualRequest: requestIdentity !== null,
      retirementMessage,
      count: 1,
      elapsed: 0,
      exposed: false,
      served: false,
      persistent,
      resolved: false,
    });
    entries.value = [...entries.value, { ...entry, id, busy: false }];
    if (persistent) bind(id, context);
    emit();
  };
  const resolveRequest = (identity: string) => {
    for (const batch of [...batches.values()]) {
      if (batch.requestIdentity !== identity || !batch.persistent) continue;
      batch.resolved = true;
      retireAction(batch.id);
      if (batch.served) remove(batch.id);
    }
  };
  const requestReporter =
    (
      captured: CapturedContext,
      reportedFailure?: (error: unknown) => void,
    ): ApiRequestReporting =>
    (descriptor: ApiRequestDescriptor) => ({
      begin() {
        captured.lifetime.requests += 1;
        let settled = false;
        return (outcome: ApiRequestOutcome) => {
          if (settled) return;
          settled = true;
          try {
            if (outcome.status === "failure") reportedFailure?.(outcome.error);
            const active = current(captured);
            const requestContext = {
              ...captured,
              kind: descriptor.kind,
              operationKey:
                captured.operationKey === "catalog.reorder.compensate" &&
                descriptor.kind === "mutation"
                  ? captured.operationKey
                  : descriptor.operationKey,
              fieldTargets: undefined,
            };
            const classification =
              outcome.status === "failure"
                ? classifyError(outcome.error, requestContext)
                : null;
            const notice =
              classification !== null &&
              classification.kind !== "cancelled" &&
              classification.kind !== "fieldValidation"
                ? classification
                : null;
            const mutationCancellation =
              classification?.kind === "cancelled" &&
              descriptor.kind === "mutation";
            const level =
              outcome.status === "success"
                ? "success"
                : mutationCancellation
                  ? "warning"
                  : classification?.kind === "cancelled"
                    ? "info"
                    : (notice?.level ?? "error");
            const classificationKey =
              outcome.status === "success"
                ? "success"
                : classification?.kind === "cancelled"
                  ? mutationCancellation
                    ? "unconfirmed"
                    : "cancelled"
                  : `${notice?.category ?? "technical"}:${notice?.code ?? "VALIDATION_ERROR"}:${notice?.status ?? "none"}:${level}`;
            const requestIdentity = JSON.stringify([
              operationIdentity(captured),
              descriptor.operationKey,
              descriptor.resourceKey,
              descriptor.kind,
            ]);
            const registration = active
              ? [...registrations.values()]
                  .reverse()
                  .find(
                    (candidate) =>
                      candidate.active &&
                      current(candidate.context) &&
                      matchesTarget(candidate.context, descriptor) &&
                      operationIdentity(candidate.context) ===
                        operationIdentity(captured),
                  )
              : undefined;
            const recoveryMeaning =
              registration === undefined
                ? null
                : [
                    registration.recovery.safety,
                    registration.recovery.actionLabel,
                  ];
            const key = active
              ? JSON.stringify([
                  requestIdentity,
                  "current",
                  classificationKey,
                  recoveryMeaning,
                ])
              : JSON.stringify([
                  "retired",
                  outcome.receipt.id,
                  classificationKey,
                ]);
            const retirementMessage =
              outcome.status === "success"
                ? descriptor.operationKey === "auth.logout"
                  ? "Вы вышли"
                  : "Запрос выполнен"
                : mutationCancellation ||
                    (descriptor.kind === "mutation" &&
                      notice?.kind === "failure" &&
                      notice.level === "warning")
                  ? "Результат запроса не подтверждён"
                  : classification?.kind === "cancelled"
                    ? "Запрос отменён"
                    : classification?.kind === "domainRefusal"
                      ? "Запрос отклонён"
                      : "Запрос завершился ошибкой";
            const message = !active
              ? retirementMessage
              : outcome.status === "success"
                ? requestSuccessMessage(
                    descriptor.operationKey,
                    captured.operationKey,
                  )
                : mutationCancellation
                  ? "Не удалось подтвердить сохранение"
                  : classification?.kind === "cancelled"
                    ? "Запрос отменён"
                    : (notice?.message ?? "Проверьте введённые данные");
            if (outcome.status === "success" && active)
              resolveRequest(requestIdentity);
            if (notice !== null)
              console.error("operation_failure", {
                category: notice.category,
                code: notice.code,
                occurrenceId: outcome.receipt.id,
                operationKey: descriptor.operationKey,
                ...(notice.status === null ? {} : { status: notice.status }),
                ...(notice.requestId === null
                  ? {}
                  : { requestId: notice.requestId }),
              });
            append(
              key,
              { level, message },
              active ? captured : retiredContext(captured),
              active
                ? requestIdentity
                : JSON.stringify(["retired", outcome.receipt.id]),
              level === "warning" || level === "error",
              active ? descriptor : undefined,
              retirementMessage,
            );
          } finally {
            captured.lifetime.requests -= 1;
            cleanupLifetime(captured.epoch, captured.lifetime);
          }
        };
      },
    });
  const retiredContext = (context: CapturedContext): CapturedContext => ({
    attemptId: "retired-request",
    epoch: context.epoch,
    kind: context.kind,
    operationKey: "retired.request",
    resourceKey: "retired",
    origin: "automatic",
    generation: null,
    issuedGeneration: null,
    lifetime: context.lifetime,
  });
  const resolveOperation = (context: CapturedContext) => {
    for (const batch of [...batches.values()]) {
      if (operationIdentity(batch.context) !== operationIdentity(context))
        continue;
      batch.resolved = true;
      retireAction(batch.id);
      if (batch.served) remove(batch.id);
    }
  };
  const runtime: NotificationRuntime = {
    get entries() {
      return entries.value;
    },
    get visibleEntries() {
      return visible();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reporting(context) {
      return requestReporter(capture(context));
    },
    async run<T>(
      context: OperationContext,
      execute: (reporting: ApiRequestReporting) => Promise<T>,
    ): Promise<OperationResult<T>> {
      const identity = operationIdentity(context);
      let generation = generations.get(identity);
      if (generation === undefined) {
        generation = { latestIssued: 0, active: 0 };
        generations.set(identity, generation);
      }
      generation.latestIssued += 1;
      generation.active += 1;
      const captured = capture(context, generation);
      captured.lifetime.runs += 1;
      const reportedFailures = new Set<unknown>();
      try {
        const value = await execute(
          requestReporter(captured, (error) => reportedFailures.add(error)),
        );
        if (!current(captured)) return { status: "cancelled" };
        return { status: "success", value };
      } catch (error) {
        if (!current(captured)) return { status: "cancelled" };
        const classified = classifyError(error, captured);
        if (classified.kind === "cancelled") return { status: "cancelled" };
        const notice =
          classified.kind === "fieldValidation"
            ? classified.notification
            : classified;
        if (
          !reportedFailures.has(error) &&
          !hasReportedReceipt(error) &&
          captured.reportFailure !== false &&
          notice !== undefined
        ) {
          append(
            JSON.stringify([
              identity,
              notice.category,
              notice.code,
              notice.status,
            ]),
            { level: notice.level, message: notice.message },
            captured,
            null,
            true,
          );
          console.error("operation_failure", {
            category: notice.category,
            code: notice.code,
            occurrenceId: notice.occurrenceId,
            operationKey: captured.operationKey,
          });
        }
        if (classified.kind === "fieldValidation")
          return { status: "fieldValidation", fields: classified.fields };
        if (classified.kind === "domainRefusal")
          return { status: "domainRefusal", error };
        return {
          status:
            captured.kind === "mutation" && classified.level === "warning"
              ? "unconfirmed"
              : "failure",
          error,
        };
      } finally {
        reportedFailures.clear();
        generation.active -= 1;
        if (generation.active === 0 && generations.get(identity) === generation)
          generations.delete(identity);
        captured.lifetime.runs -= 1;
        cleanupLifetime(captured.epoch, captured.lifetime);
      }
    },
    publishOutcome(key: OperationOutcomeKey, context: OperationContext) {
      const captured = capture(context);
      if (!current(captured) || !Object.hasOwn(outcomeMessages, key)) return;
      const outcome = outcomeMessages[key];
      append(
        JSON.stringify([operationIdentity(captured), key]),
        outcome,
        captured,
        null,
        outcome.level === "warning",
      );
    },
    dismiss(id) {
      settleTime();
      if (entries.value.find((entry) => entry.id === id)?.busy) return;
      remove(id);
      emit();
    },
    resolve(operationKey, resourceKey, epoch) {
      const context = capture({
        attemptId: "explicit-resolution",
        epoch,
        kind: "read",
        operationKey,
        resourceKey,
        origin: "automatic",
      });
      resolveOperation(context);
      cleanupLifetime(epoch, context.lifetime);
      emit();
    },
    clearSession(epoch, scope = "owner") {
      const lifetime = lifetimes.get(epoch);
      if (scope === "session")
        lifetimes.forEach((value) => {
          value.active = false;
        });
      else if (lifetime !== undefined) lifetime.active = false;
      for (const registration of [...registrations.values()]) {
        if (scope !== "session" && registration.context.epoch !== epoch)
          continue;
        registration.active = false;
        registrations.delete(registration.id);
      }
      for (const batch of [...batches.values()]) {
        if (scope !== "session" && batch.context.epoch !== epoch) continue;
        if (!batch.actualRequest) {
          remove(batch.id);
          continue;
        }
        retireAction(batch.id);
        const entry = entries.value.find(
          (candidate) => candidate.id === batch.id,
        );
        if (entry === undefined) continue;
        batch.context = retiredContext(batch.context);
        batch.requestIdentity = null;
        batch.descriptor = undefined;
        batch.key = JSON.stringify(["retired", batch.id]);
        updateEntry(batch.id, {
          message: batch.retirementMessage ?? "Запрос завершён",
        });
      }
      for (const [ownerEpoch, ownerLifetime] of lifetimes)
        cleanupLifetime(ownerEpoch, ownerLifetime);
      emit();
    },
    registerRecovery(context: OperationContext, recovery: OperationRecovery) {
      const captured = capture(context);
      if (captured.kind === "mutation" && recovery.safety === "read")
        throw new Error(
          "Mutation recovery requires idempotency or reconciliation.",
        );
      const registration: RecoveryRegistration = {
        active: true,
        context: captured,
        id: crypto.randomUUID(),
        recovery,
      };
      registrations.set(registration.id, registration);
      for (const batch of batches.values())
        if (
          batch.persistent &&
          !batch.resolved &&
          operationIdentity(batch.context) === operationIdentity(captured)
        )
          bind(batch.id, batch.context);
      emit();
      return () => {
        if (!registration.active) return;
        registration.active = false;
        registrations.delete(registration.id);
        for (const [id, bound] of bindings)
          if (bound === registration.id) retireAction(id);
        cleanupLifetime(captured.epoch, captured.lifetime);
        emit();
      };
    },
    recover(id) {
      const registrationId = bindings.get(id);
      const registration =
        registrationId === undefined
          ? undefined
          : registrations.get(registrationId);
      const entry = entries.value.find((candidate) => candidate.id === id);
      if (
        registration === undefined ||
        !registration.active ||
        entry === undefined ||
        entry.busy
      )
        return;
      if (!current(registration.context)) {
        retireAction(id);
        emit();
        return;
      }
      settleTime();
      updateEntry(id, { actionLabel: "Повторяем…", busy: true });
      emit();
      let invoked = false;
      const invocation = {
        run<T>(execute: (reporting: ApiRequestReporting) => Promise<T>) {
          invoked = true;
          return runtime.run(
            {
              ...registration.context,
              attemptId: crypto.randomUUID(),
              origin: "recovery",
            },
            execute,
          );
        },
      };
      void Promise.resolve()
        .then(() => registration.recovery.execute(invocation))
        .then(async (result) => {
          if (!registration.active || bindings.get(id) !== registration.id)
            return;
          if (result.status === "success") {
            const batch = batches.get(id);
            if (batch !== undefined) {
              batch.resolved = true;
              retireAction(id);
              if (batch.served) remove(id);
            }
          } else if (!invoked && "error" in result)
            await invocation.run(() => Promise.reject(result.error));
        })
        .catch((error: unknown) => invocation.run(() => Promise.reject(error)))
        .finally(() => {
          if (registration.active && bindings.get(id) === registration.id)
            updateEntry(id, {
              actionLabel: registration.recovery.actionLabel,
              busy: false,
            });
          emit();
        });
    },
    setVisibility(next: OperationVisibility) {
      settleTime();
      visibility = next;
      emit();
    },
  };
  return runtime;
}

function hasReportedReceipt(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("settlement" in error))
    return false;
  const receipt = error.settlement;
  return (
    typeof receipt === "object" &&
    receipt !== null &&
    "reported" in receipt &&
    receipt.reported === true
  );
}

function requestSuccessMessage(operationKey: string, intent: string): string {
  if (
    intent === "catalog.reorder.compensate" &&
    operationKey.endsWith(".reorder")
  )
    return "Порядок восстановлен";
  return Object.hasOwn(requestSuccessMessages, operationKey)
    ? requestSuccessMessages[
        operationKey as keyof typeof requestSuccessMessages
      ]
    : "Запрос выполнен";
}

function operationCountLabel(count: number): string {
  const tail = count % 100;
  const unit = count % 10;
  const noun =
    tail >= 11 && tail <= 14
      ? "операций"
      : unit === 1
        ? "операция"
        : unit >= 2 && unit <= 4
          ? "операции"
          : "операций";
  return `${count} ${noun}`;
}
