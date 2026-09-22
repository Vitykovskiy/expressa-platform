import { shallowRef } from "vue";
import type {
  OperationContext,
  OperationOutcomeKey,
  OperationRecovery,
  OperationResult,
  OperationVisibility,
} from "../../shared/lib/operations/operation.types";
import { classifyError } from "./error-taxonomy";
import { outcomeMessages } from "./error-taxonomy.constants";
import {
  defaultNotificationVisibility,
  narrowNotificationViewport,
  notificationLifetimeMs,
  notificationTickMs,
} from "./notification-runtime.constants";
import type {
  CapturedContext,
  NotificationEntry,
  NotificationEpisode,
  NotificationFailureMetadata,
  NotificationRuntime,
  OperationGeneration,
  RecoveryRegistration,
  TimedEntry,
} from "./notification-runtime.types";

export function createNotificationRuntime(): NotificationRuntime {
  const entries = shallowRef<readonly NotificationEntry[]>([]);
  const episodes: NotificationEpisode[] = [];
  const processedOccurrences = new Map<string, string>();
  const generations: OperationGeneration[] = [];
  const registrations = new Map<string, RecoveryRegistration>();
  const entryBindings = new Map<string, string>();
  const entryContexts = new Map<string, CapturedContext>();
  const timedEntries = new Map<string, TimedEntry>();
  const invalidEpochs = new Set<string>();
  const listeners = new Set<() => void>();
  let visibility = defaultNotificationVisibility;
  let clock: ReturnType<typeof setInterval> | null = null;
  let lastClock = 0;
  const recoveringEntries = new Map<string, string>();

  const now = () => {
    lastClock = Math.max(lastClock, performance.now());
    return lastClock;
  };
  const sameOperation = (
    left: Pick<CapturedContext, "epoch" | "operationKey" | "resourceKey">,
    right: Pick<CapturedContext, "epoch" | "operationKey" | "resourceKey">,
  ) =>
    left.epoch === right.epoch &&
    left.operationKey === right.operationKey &&
    left.resourceKey === right.resourceKey;
  const notify = () => listeners.forEach((listener) => listener());
  const emit = () => {
    updateClock();
    notify();
  };
  const getVisibleEntries = () => {
    const maximum =
      visibility.viewportWidth >= narrowNotificationViewport ? 3 : 1;
    return entries.value.slice(0, visibility.stackFits ? maximum : 1);
  };
  const isCurrent = (context: CapturedContext) => {
    if (invalidEpochs.has(context.epoch) || context.ownerIsActive?.() === false)
      return false;
    if (context.generation === null) return true;
    return (
      generations.find((candidate) => sameOperation(candidate, context))
        ?.latestIssued === context.generation
    );
  };
  const capture = (
    context: OperationContext,
    generation: number | null = null,
  ): CapturedContext => ({
    attemptId: context.attemptId,
    epoch: context.epoch,
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
    generation,
    kind: context.kind,
    operationKey: context.operationKey,
    ownerIsActive: context.ownerIsActive,
    origin: context.origin,
    reportFailure: context.reportFailure,
    resourceKey: context.resourceKey,
  });
  const startAttempt = (context: OperationContext) => {
    const base = capture(context);
    let generation = generations.find((candidate) =>
      sameOperation(candidate, base),
    );
    if (generation === undefined) {
      generation = {
        epoch: base.epoch,
        latestIssued: 0,
        operationKey: base.operationKey,
        resourceKey: base.resourceKey,
      };
      generations.push(generation);
    }
    generation.latestIssued += 1;
    return capture(context, generation.latestIssued);
  };
  const updateEntry = (id: string, update: Partial<NotificationEntry>) => {
    entries.value = entries.value.map((entry) =>
      entry.id === id ? { ...entry, ...update } : entry,
    );
  };
  const settleTimedEntries = () => {
    const current = now();
    const visibleIds = new Set(getVisibleEntries().map((entry) => entry.id));
    timedEntries.forEach((timed, id) => {
      const paused =
        visibility.hidden ||
        !visibleIds.has(id) ||
        visibility.hoveredId === id ||
        visibility.focusedId === id;
      if (!paused) timed.elapsed += Math.max(0, current - timed.lastTick);
      timed.lastTick = current;
    });
  };
  const removeEntry = (id: string, settle = true) => {
    if (settle) settleTimedEntries();
    entries.value = entries.value.filter((entry) => entry.id !== id);
    entryContexts.delete(id);
    entryBindings.delete(id);
    timedEntries.delete(id);
  };
  const findEpisode = (
    context: CapturedContext,
    category: NotificationEpisode["category"],
    code: string,
  ) =>
    episodes.find(
      (episode) =>
        sameOperation(episode.context, context) &&
        episode.category === category &&
        episode.code === code,
    );
  const removeEpisode = (episode: NotificationEpisode) => {
    const index = episodes.indexOf(episode);
    if (index >= 0) episodes.splice(index, 1);
    if (episode.entryId !== null) removeEntry(episode.entryId);
  };
  const resolveContext = (context: CapturedContext) => {
    episodes
      .filter((episode) => sameOperation(episode.context, context))
      .forEach(removeEpisode);
  };
  const registrationFor = (context: CapturedContext) =>
    [...registrations.values()]
      .reverse()
      .find(
        (registration) =>
          registration.active && sameOperation(registration.context, context),
      );
  const bindRecovery = (entryId: string, context: CapturedContext) => {
    const registration = registrationFor(context);
    if (registration === undefined) return;
    entryBindings.set(entryId, registration.id);
    updateEntry(entryId, { actionLabel: registration.recovery.actionLabel });
  };
  const appendEntry = (entry: NotificationEntry, context: CapturedContext) => {
    settleTimedEntries();
    entries.value = [...entries.value, entry];
    entryContexts.set(entry.id, context);
    if (entry.level === "success" || entry.level === "info")
      timedEntries.set(entry.id, { elapsed: 0, lastTick: now() });
    bindRecovery(entry.id, context);
  };
  const logFailure = (
    occurrenceId: string,
    context: CapturedContext,
    metadata: NotificationFailureMetadata,
  ) => {
    console.error("operation_failure", {
      category: metadata.category,
      code: metadata.code,
      occurrenceId,
      operationKey: context.operationKey,
      ...(metadata.status === null ? {} : { status: metadata.status }),
      ...(metadata.requestId === null ? {} : { requestId: metadata.requestId }),
      ...(metadata.clientStack === undefined
        ? {}
        : { clientStack: metadata.clientStack }),
    });
  };
  const updateClock = () => {
    if (timedEntries.size === 0) {
      if (clock !== null) clearInterval(clock);
      clock = null;
    } else if (clock === null) clock = setInterval(tick, notificationTickMs);
  };
  const tick = () => {
    settleTimedEntries();
    const expired = [...timedEntries]
      .filter(([, timed]) => timed.elapsed >= notificationLifetimeMs)
      .map(([id]) => id);
    expired.forEach((id) => removeEntry(id, false));
    if (expired.length > 0) emit();
  };

  const runtime = {
    get entries() {
      return entries.value;
    },
    get visibleEntries() {
      return getVisibleEntries();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async run<T>(
      context: OperationContext,
      execute: () => Promise<T>,
      recovery?: { entryId: string; registrationId: string },
    ): Promise<OperationResult<T>> {
      const captured = startAttempt(context);
      try {
        const value = await execute();
        if (!isCurrent(captured)) return { status: "cancelled" };
        resolveContext(captured);
        emit();
        return { status: "success", value };
      } catch (error) {
        if (!isCurrent(captured)) return { status: "cancelled" };
        const classified = classifyError(error, captured);
        if (classified.kind === "cancelled") return { status: "cancelled" };
        if (
          classified.kind === "fieldValidation" &&
          classified.notification === undefined
        )
          return { status: "fieldValidation", fields: classified.fields };
        const notice =
          classified.kind === "fieldValidation"
            ? classified.notification
            : classified;
        if (notice === undefined) return { status: "failure", error };
        if (captured.reportFailure === false)
          return {
            status:
              captured.kind === "mutation" && notice.level === "warning"
                ? "unconfirmed"
                : "failure",
            error,
          };
        const metadata: NotificationFailureMetadata = {
          category: notice.category,
          clientStack: notice.clientStack,
          code: notice.code,
          requestId: notice.requestId,
          status: notice.status,
        };
        if (!processedOccurrences.has(notice.occurrenceId)) {
          processedOccurrences.set(notice.occurrenceId, captured.epoch);
          logFailure(notice.occurrenceId, captured, metadata);
          const recoveryEntryId =
            recovery !== undefined &&
            recoveringEntries.get(recovery.entryId) ===
              recovery.registrationId &&
            registrations.get(recovery.registrationId)?.active === true
              ? recovery.entryId
              : undefined;
          const recoveryEpisode =
            recoveryEntryId === undefined
              ? undefined
              : episodes.find((episode) => episode.entryId === recoveryEntryId);
          let episode =
            recoveryEpisode ??
            findEpisode(captured, notice.category, notice.code);
          if (
            episode !== undefined &&
            captured.origin === "user" &&
            recoveryEpisode === undefined
          ) {
            removeEpisode(episode);
            episode = undefined;
          }
          if (episode === undefined) {
            const id = notice.occurrenceId;
            episode = {
              category: notice.category,
              code: notice.code,
              context: captured,
              dismissed: false,
              entryId: id,
              latestAttemptId: captured.attemptId,
              latestFailure: metadata,
              occurrences: 1,
            };
            episodes.push(episode);
            appendEntry(
              { busy: false, id, level: notice.level, message: notice.message },
              captured,
            );
          } else {
            episode.category = notice.category;
            episode.code = notice.code;
            episode.latestAttemptId = captured.attemptId;
            episode.latestFailure = metadata;
            episode.occurrences += 1;
            if (episode.entryId !== null)
              updateEntry(episode.entryId, {
                busy: false,
                level: notice.level,
                message: notice.message,
              });
          }
          emit();
        }
        if (classified.kind === "fieldValidation")
          return { status: "fieldValidation", fields: classified.fields };
        if (classified.kind === "domainRefusal")
          return { status: "domainRefusal", error };
        return {
          status:
            captured.kind === "mutation" && notice.level === "warning"
              ? "unconfirmed"
              : "failure",
          error,
        };
      }
    },
    publishOutcome(key: OperationOutcomeKey, context: OperationContext) {
      const captured = capture(context);
      if (!isCurrent(captured) || !Object.hasOwn(outcomeMessages, key)) return;
      const outcome = outcomeMessages[key];
      appendEntry(
        {
          busy: false,
          id: crypto.randomUUID(),
          level: outcome.level,
          message: outcome.message,
        },
        captured,
      );
      emit();
    },
    dismiss(id: string) {
      const episode = episodes.find((candidate) => candidate.entryId === id);
      if (episode !== undefined) {
        episode.dismissed = true;
        episode.entryId = null;
      }
      removeEntry(id);
      emit();
    },
    resolve(operationKey: string, resourceKey: string, epoch: string) {
      const context = capture({
        attemptId: "explicit-resolution",
        epoch,
        kind: "read",
        operationKey,
        origin: "automatic",
        resourceKey,
      });
      resolveContext(context);
      [...entryContexts.entries()]
        .filter(([, entryContext]) => sameOperation(entryContext, context))
        .forEach(([id]) => removeEntry(id));
      emit();
    },
    clearSession(epoch: string) {
      invalidEpochs.add(epoch);
      [...processedOccurrences.entries()]
        .filter(([, value]) => value === epoch)
        .forEach(([id]) => processedOccurrences.delete(id));
      episodes
        .filter((episode) => episode.context.epoch === epoch)
        .forEach(removeEpisode);
      for (const generation of [...generations])
        if (generation.epoch === epoch)
          generations.splice(generations.indexOf(generation), 1);
      for (const registration of registrations.values())
        if (registration.context.epoch === epoch) {
          registration.active = false;
          registrations.delete(registration.id);
        }
      [...entryContexts.entries()]
        .filter(([, context]) => context.epoch === epoch)
        .forEach(([id]) => removeEntry(id));
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
      episodes
        .filter(
          (episode) =>
            sameOperation(episode.context, captured) &&
            episode.entryId !== null,
        )
        .forEach((episode) =>
          bindRecovery(episode.entryId as string, captured),
        );
      emit();
      return () => {
        if (!registration.active) return;
        registration.active = false;
        registrations.delete(registration.id);
        [...entryBindings.entries()]
          .filter(([, bound]) => bound === registration.id)
          .forEach(([entryId]) => {
            entryBindings.delete(entryId);
            updateEntry(entryId, { actionLabel: undefined, busy: false });
          });
        emit();
      };
    },
    recover(id: string) {
      const registrationId = entryBindings.get(id);
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
      if (!isCurrent(registration.context)) {
        entryBindings.delete(id);
        updateEntry(id, { actionLabel: undefined });
        emit();
        return;
      }
      updateEntry(id, { actionLabel: "Повторяем…", busy: true });
      emit();
      recoveringEntries.set(id, registration.id);
      let invokedBoundary = false;
      const recovery = {
        entryId: id,
        registrationId: registration.id,
      };
      const invocation = {
        run<T>(execute: () => Promise<T>) {
          invokedBoundary = true;
          return runtime.run(
            {
              ...registration.context,
              attemptId: crypto.randomUUID(),
              origin: "recovery",
            },
            execute,
            recovery,
          );
        },
      };
      const reenable = () => {
        if (
          registration.active &&
          entryBindings.get(id) === registration.id &&
          entries.value.some((candidate) => candidate.id === id)
        ) {
          updateEntry(id, {
            actionLabel: registration.recovery.actionLabel,
            busy: false,
          });
          emit();
        }
      };
      const reportTerminal = (error: unknown) => {
        return invocation
          .run(() => Promise.reject(error))
          .then((result) => {
            reenable();
            return result;
          });
      };
      void Promise.resolve()
        .then(() => registration.recovery.execute(invocation))
        .then((result) => {
          if (
            !registration.active ||
            entryBindings.get(id) !== registration.id ||
            !entries.value.some((candidate) => candidate.id === id)
          )
            return;
          if (result.status === "success") {
            resolveContext(registration.context);
            emit();
            return;
          }
          if (
            !invokedBoundary &&
            (result.status === "failure" ||
              result.status === "unconfirmed" ||
              result.status === "domainRefusal")
          ) {
            return reportTerminal(result.error);
          }
          reenable();
        })
        .catch((error: unknown) => {
          return reportTerminal(error);
        })
        .finally(() => recoveringEntries.delete(id));
    },
    setVisibility(nextVisibility: OperationVisibility) {
      settleTimedEntries();
      visibility = nextVisibility;
      emit();
    },
  };
  return runtime;
}
