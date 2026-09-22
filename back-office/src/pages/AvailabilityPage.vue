<template>
  <AvailabilityScreen
    :active-category="activeCategory"
    :groups="availability?.groups ?? []"
    :intake="availability?.intake ?? null"
    :loading="loading"
    :search="search"
    :saving="saving"
    @availability-change="updateAvailability"
    @intake-change="updateIntake"
    @update:active-category="activeCategory = $event"
    @update:search="search = $event"
  />
</template>

<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useSessionStore } from "../app/session.store";
import { AvailabilityApi } from "../shared/api/availability.api";
import { apiClientKey } from "../shared/api/client";
import type {
  Availability,
  AvailabilityItem,
  AvailabilityUpdate,
} from "../shared/api/availability.api.types";
import AvailabilityScreen from "./admin/availability/AvailabilityScreen.vue";
import { AVAILABILITY_ALL_CATEGORY } from "./admin/availability/AvailabilityScreen.constants";
import {
  getOperationPort,
  type OperationContext,
  type OperationResult,
} from "../shared/lib/operations/operation-port";

const apiClient = inject(apiClientKey);
if (apiClient === undefined) {
  throw new Error("AvailabilityPage requires an ApiClient provider.");
}
const availabilityApi = new AvailabilityApi(apiClient);
const sessionStore = useSessionStore();
const route = useRoute();
const router = useRouter();
const availability = shallowRef<Availability | null>(null);
const loading = shallowRef(true);
const saving = shallowRef(false);
const search = shallowRef(readQueryValue("q"));
const activeCategory = shallowRef(
  readQueryValue("category") || AVAILABILITY_ALL_CATEGORY,
);
let loadRequest = 0;
let pageActive = true;
const pageEpoch = crypto.randomUUID();
const operationPort = getOperationPort();
const recoveryDisposers = new Set<() => void>();

onMounted(() => void loadAvailability());
onBeforeUnmount(() => {
  pageActive = false;
  recoveryDisposers.forEach((dispose) => dispose());
  recoveryDisposers.clear();
});
watch([search, activeCategory], () => void persistQuery());

async function loadAvailability(): Promise<void> {
  if (saving.value) return;
  const request = ++loadRequest;
  loading.value = true;
  const result = await runRead("availability.load", "availability", () =>
    sessionStore.readWithRecovery((accessToken) =>
      availabilityApi.get(accessToken),
    ),
  );
  if (request === loadRequest && result.status === "success")
    availability.value = result.value;
  if (request === loadRequest) loading.value = false;
}

async function updateAvailability(
  item: AvailabilityItem,
  isAvailable: boolean,
): Promise<void> {
  const current = availability.value;
  const accessToken = sessionStore.accessToken;
  if (current === null || accessToken === null || loading.value || saving.value)
    return;

  saving.value = true;
  availability.value = {
    ...current,
    groups: current.groups.map((group) => ({
      ...group,
      items: group.items.map((currentItem) =>
        currentItem.id === item.id && currentItem.type === item.type
          ? { ...currentItem, isAvailable }
          : currentItem,
      ),
    })),
  };
  const result = await operationPort.run(
    operationContext(
      "availability.item.update",
      `${item.type}:${item.id}`,
      "mutation",
    ),
    () => availabilityApi.update(accessToken, item.type, item.id, isAvailable),
  );
  if (result.status === "success")
    availability.value = replaceAvailability(current, result.value);
  else if (result.status !== "cancelled") availability.value = current;
  saving.value = false;
}

async function updateIntake(acceptsNewOrders: boolean): Promise<void> {
  const current = availability.value;
  const accessToken = sessionStore.accessToken;
  if (current === null || accessToken === null || loading.value || saving.value)
    return;

  saving.value = true;
  availability.value = {
    ...current,
    intake: { ...current.intake, acceptsNewOrders },
  };
  const result = await operationPort.run(
    operationContext("availability.intake.update", "intake", "mutation"),
    () => availabilityApi.updateIntake(accessToken, acceptsNewOrders),
  );
  if (result.status === "success")
    availability.value = { ...current, intake: result.value };
  else if (result.status !== "cancelled") availability.value = current;
  saving.value = false;
}

function replaceAvailability(
  current: Availability,
  confirmed: AvailabilityUpdate,
): Availability {
  return {
    ...current,
    groups: current.groups.map((group) => ({
      ...group,
      items: group.items.map((item) =>
        item.id === confirmed.id && item.type === confirmed.type
          ? { ...item, isAvailable: confirmed.isAvailable }
          : item,
      ),
    })),
  };
}

async function persistQuery(): Promise<void> {
  const query = {
    ...(search.value ? { q: search.value } : {}),
    ...(activeCategory.value !== AVAILABILITY_ALL_CATEGORY
      ? { category: activeCategory.value }
      : {}),
  };
  await router.replace({ query });
}

function readQueryValue(key: "category" | "q"): string {
  const value = route.query[key];
  return typeof value === "string" ? value : "";
}

function operationContext(
  operationKey: string,
  resourceKey: string,
  kind: OperationContext["kind"],
): OperationContext {
  return {
    attemptId: crypto.randomUUID(),
    epoch: pageEpoch,
    kind,
    operationKey,
    origin: "user",
    ownerIsActive: () => pageActive,
    resourceKey,
  };
}

async function runRead<T>(
  operationKey: string,
  resourceKey: string,
  execute: () => Promise<T>,
): Promise<OperationResult<T>> {
  const context = operationContext(operationKey, resourceKey, "read");
  const dispose = operationPort.registerRecovery(context, {
    actionLabel: "Повторить",
    safety: "read",
    execute: (invocation) => invocation.run(execute),
  });
  const result = await operationPort.run(context, execute);
  if (result.status === "success" || result.status === "cancelled") dispose();
  else recoveryDisposers.add(dispose);
  return result;
}
</script>
