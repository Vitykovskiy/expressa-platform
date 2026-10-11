<template>
  <div class="notifications-control">
    <UiButton variant="quiet" @activate="show">Уведомления</UiButton>
    <span
      v-if="view.indicator"
      class="notifications-control__status"
      role="status"
      >{{ view.indicator }}</span
    >
    <UiDialog
      :open="open"
      title="Уведомления"
      :restore-focus="false"
      @update:open="changeOpen"
      @closed="closed"
    >
      <div ref="body" class="notifications-body">
        <p>Сообщать о новых заказах</p>
        <p role="status" aria-atomic="true">{{ view.message }}</p>
        <p v-if="view.context">{{ view.context }}</p>
        <p v-if="view.recovery">{{ view.recovery }}</p>
      </div>
      <template #actions>
        <UiButton variant="secondary" @activate="changeOpen(false)"
          >Закрыть</UiButton
        >
        <UiButton
          v-if="view.primary !== null"
          :loading="view.pending"
          :disabled="busy"
          @activate="act"
          >{{ view.primaryLabel }}</UiButton
        >
      </template>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref, useTemplateRef, watch } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import UiDialog from "../../shared/ui/UiDialog/UiDialog.vue";
import type {
  NotificationsEmits,
  NotificationsProps,
} from "./Notifications.types";

const props = defineProps<NotificationsProps>();
const emit = defineEmits<NotificationsEmits>();
const open = ref(false);
const body = useTemplateRef<HTMLElement>("body");
let initiator: HTMLElement | null = null;
let identity = "";
let section = "";
let closingFocus: Element | null = null;
let closingSurface: Element | null = null;
let returnAllowed = false;
let disposed = false;

function show(event: MouseEvent) {
  if (props.identity === "" || open.value) return;

  initiator =
    event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  identity = props.identity;
  section = props.section;
  open.value = true;
  returnAllowed = true;
  emit("open-change", true);
  emit("read");
}

function changeOpen(value: boolean) {
  if (value || !open.value) return;

  closingFocus = document.activeElement;
  closingSurface =
    body.value?.closest('[role="dialog"], [aria-modal="true"]') ?? null;
  returnAllowed =
    returnAllowed &&
    closingSurface !== null &&
    closingFocus !== null &&
    closingSurface.contains(closingFocus);
  open.value = false;
  emit("open-change", false);
}

function closed() {
  if (
    disposed ||
    open.value ||
    !returnAllowed ||
    identity !== props.identity ||
    section !== props.section ||
    (document.activeElement !== closingFocus &&
      document.activeElement !== document.body &&
      !closingSurface?.contains(document.activeElement))
  )
    return;
  if (
    [...document.querySelectorAll('dialog[open], [aria-modal="true"]')].some(
      (element) => element.getClientRects().length > 0,
    )
  )
    return;

  const target =
    initiator?.isConnected && initiator.getClientRects().length > 0
      ? initiator
      : document.getElementById("staff-section-heading");

  target?.focus({ preventScroll: true });
  returnAllowed = false;
}

function act() {
  if (props.busy || props.view.pending) return;

  const action = props.view.primary;

  if (action === "enable") emit("enable");
  else if (action === "disable") emit("disable");
  else if (action === "read") emit("read");
  else if (action === "finish") emit("finish");
}

watch(
  () => [props.identity, props.section],
  () => {
    returnAllowed = false;
    if (props.identity !== identity && open.value) {
      open.value = false;
      emit("open-change", false);
    }
  },
  { flush: "sync" },
);

onUnmounted(() => {
  disposed = true;
  returnAllowed = false;
  emit("open-change", false);
});
</script>

<style scoped>
.notifications-control {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-sm);
}
.notifications-control__status {
  font-size: var(--font-data);
  color: var(--color-foreground-muted);
}
.notifications-body {
  display: grid;
  gap: var(--space-lg);
}
</style>
