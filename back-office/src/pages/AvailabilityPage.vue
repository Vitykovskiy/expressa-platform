<template>
  <AvailabilityScreen
    :error="error"
    :groups="availability?.groups ?? []"
    :intake="availability?.intake ?? null"
    :loading="loading"
    :saving="saving"
    @availability-change="updateAvailability"
    @intake-change="updateIntake"
    @retry="loadAvailability"
  />
</template>

<script setup lang="ts">
import { onMounted, shallowRef } from "vue";

import { useSessionStore } from "../app/session.store";
import { AvailabilityApi } from "../shared/api/availability.api";
import { createApiClient } from "../shared/api/client";
import type {
  Availability,
  AvailabilityApiError,
  AvailabilityItem,
  AvailabilityUpdate,
} from "../shared/api/availability.api.types";
import AvailabilityScreen from "./admin/availability/AvailabilityScreen.vue";

const availabilityApi = new AvailabilityApi(createApiClient("/"));
const sessionStore = useSessionStore();
const availability = shallowRef<Availability | null>(null);
const error = shallowRef<AvailabilityApiError | null>(null);
const loading = shallowRef(true);
const saving = shallowRef(false);
let loadRequest = 0;

onMounted(() => void loadAvailability());

async function loadAvailability(): Promise<void> {
  const request = ++loadRequest;
  const accessToken = sessionStore.accessToken;
  if (accessToken === null) {
    setLoadError(request, unauthorizedError());
    return;
  }

  loading.value = true;
  error.value = null;
  try {
    const nextAvailability = await availabilityApi.get(accessToken);
    if (request !== loadRequest) return;
    availability.value = nextAvailability;
  } catch (requestError) {
    setLoadError(request, toAvailabilityApiError(requestError));
  } finally {
    if (request === loadRequest) loading.value = false;
  }
}

async function updateAvailability(
  item: AvailabilityItem,
  isAvailable: boolean,
): Promise<void> {
  const current = availability.value;
  const accessToken = sessionStore.accessToken;
  if (current === null || accessToken === null || saving.value) return;

  saving.value = true;
  error.value = null;
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
  try {
    const confirmed = await availabilityApi.update(
      accessToken,
      item.type,
      item.id,
      isAvailable,
    );
    availability.value = replaceAvailability(current, confirmed);
  } catch (requestError) {
    availability.value = current;
    error.value = toAvailabilityApiError(requestError);
  } finally {
    saving.value = false;
  }
}

async function updateIntake(acceptsNewOrders: boolean): Promise<void> {
  const current = availability.value;
  const accessToken = sessionStore.accessToken;
  if (current === null || accessToken === null || saving.value) return;

  saving.value = true;
  error.value = null;
  availability.value = {
    ...current,
    intake: { ...current.intake, acceptsNewOrders },
  };
  try {
    const intake = await availabilityApi.updateIntake(
      accessToken,
      acceptsNewOrders,
    );
    availability.value = { ...current, intake };
  } catch (requestError) {
    availability.value = current;
    error.value = toAvailabilityApiError(requestError);
  } finally {
    saving.value = false;
  }
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

function setLoadError(request: number, nextError: AvailabilityApiError): void {
  if (request !== loadRequest) return;
  availability.value = null;
  error.value = nextError;
}

function unauthorizedError(): AvailabilityApiError {
  return {
    code: "UNAUTHORIZED",
    details: null,
    message: "Сессия сотрудника не найдена.",
    requestId: null,
    status: 401,
  };
}

function toAvailabilityApiError(error: unknown): AvailabilityApiError {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "details" in error &&
    "message" in error &&
    "requestId" in error &&
    "status" in error &&
    typeof error.code === "string" &&
    typeof error.message === "string" &&
    (typeof error.requestId === "string" || error.requestId === null) &&
    (typeof error.status === "number" || error.status === null)
  ) {
    return {
      code: error.code,
      details: error.details,
      message: error.message,
      requestId: error.requestId,
      status: error.status,
    };
  }

  return {
    code: "API_CONTRACT_ERROR",
    details: null,
    message: "Сервис доступности вернул некорректный ответ.",
    requestId: null,
    status: null,
  };
}
</script>
