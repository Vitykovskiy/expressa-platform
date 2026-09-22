<template>
  <section
    ref="host"
    class="notification-host"
    role="region"
    aria-live="polite"
    aria-label="Уведомления"
  >
    <article
      v-for="entry in entries"
      :key="entry.id"
      class="notification-host__card"
      :class="`notification-host__card--${entry.level}`"
      @pointerdown.capture="captureOrigin(entry.id)"
      @focusin="setFocused(entry.id, $event)"
      @focusout="setFocused(null)"
      @pointerenter="setHovered(entry.id)"
      @pointerleave="setHovered(null)"
    >
      <component :is="iconFor(entry.level)" class="notification-host__icon" />
      <div class="notification-host__content">
        <p>{{ entry.message }}</p>
        <button
          v-if="entry.actionLabel !== undefined"
          type="button"
          :disabled="entry.busy"
          @click="$emit('recover', entry.id)"
        >
          {{ entry.actionLabel }}
        </button>
      </div>
      <button
        class="notification-host__close"
        type="button"
        :disabled="entry.busy"
        aria-label="Закрыть"
        @click="dismiss(entry.id)"
      >
        <X aria-hidden="true" />
      </button>
    </article>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { CircleAlert, CircleCheck, Info, X } from "lucide-vue-next";
import type {
  NotificationHostProps,
  NotificationHostVisibility,
} from "./NotificationHost.types";

const hoveredId = ref<string | null>(null);
const focusedId = ref<string | null>(null);
const host = ref<HTMLElement | null>(null);
let lastCandidateSignature: readonly string[] = [];
let lastStackFits = true;
let lastVisibility: NotificationHostVisibility | undefined;

const props = defineProps<NotificationHostProps>();
const emit = defineEmits<{
  dismiss: [id: string];
  origin: [id: string, origin: HTMLElement | null];
  recover: [id: string];
  region: [region: HTMLElement | null];
  visibility: [visibility: NotificationHostVisibility];
}>();

function reportVisibility(forceMeasurement = false): void {
  const element = host.value;
  const cards =
    element === null
      ? []
      : [...element.querySelectorAll<HTMLElement>(".notification-host__card")];
  const styles =
    element === null ? undefined : window.getComputedStyle(element);
  const gap = styles === undefined ? 0 : Number.parseFloat(styles.rowGap) || 0;
  const availableHeight =
    styles === undefined
      ? 0
      : Number.parseFloat(styles.maxHeight) ||
        element?.getBoundingClientRect().height ||
        0;
  const stackHeight =
    cards.reduce((sum, card) => sum + card.getBoundingClientRect().height, 0) +
    Math.max(0, cards.length - 1) * gap;
  const candidateEntries = (props.candidateEntries ?? props.entries).slice(
    0,
    3,
  );
  const candidateSignature = candidateEntries.map(
    (entry) =>
      `${entry.id}:${entry.level}:${entry.busy}:${entry.actionLabel ?? ""}:${entry.message}`,
  );
  const visibleSignature = props.entries.map(
    (entry) =>
      `${entry.id}:${entry.level}:${entry.busy}:${entry.actionLabel ?? ""}:${entry.message}`,
  );
  const candidateChanged =
    candidateSignature.length !== lastCandidateSignature.length ||
    candidateSignature.some(
      (signature, index) => signature !== lastCandidateSignature[index],
    );
  const retainsCollapsedCandidate =
    !forceMeasurement &&
    !lastStackFits &&
    !candidateChanged &&
    visibleSignature.length < candidateSignature.length &&
    visibleSignature.every(
      (signature, index) => signature === lastCandidateSignature[index],
    );
  const stackFits = retainsCollapsedCandidate
    ? false
    : !lastStackFits &&
        candidateChanged &&
        cards.length < candidateSignature.length
      ? true
      : stackHeight <= availableHeight;
  if (!retainsCollapsedCandidate) {
    lastCandidateSignature = candidateSignature;
    lastStackFits = stackFits;
  }
  const nextVisibility: NotificationHostVisibility = {
    availableHeight,
    focusedId: focusedId.value,
    hidden: document.hidden,
    hoveredId: hoveredId.value,
    stackFits,
    viewportWidth: window.innerWidth,
  };
  if (
    lastVisibility !== undefined &&
    Object.entries(nextVisibility).every(
      ([key, value]) =>
        value === lastVisibility?.[key as keyof NotificationHostVisibility],
    )
  )
    return;
  lastVisibility = nextVisibility;
  emit("visibility", nextVisibility);
}

watch(
  () => [props.entries, props.candidateEntries],
  () => void nextTick(reportVisibility),
  { deep: true },
);

function setHovered(id: string | null): void {
  hoveredId.value = id;
  reportVisibility();
}

function setFocused(id: string | null, event?: FocusEvent): void {
  const origin = event?.relatedTarget;
  if (
    id !== null &&
    origin instanceof HTMLElement &&
    host.value?.contains(origin) === false
  )
    emit("origin", id, origin);
  focusedId.value = id;
  reportVisibility();
}

function dismiss(id: string): void {
  emit("dismiss", id);
}

function captureOrigin(id: string): void {
  const active = document.activeElement;
  emit("origin", id, active instanceof HTMLElement ? active : null);
}

function iconFor(level: "error" | "warning" | "success" | "info") {
  if (level === "success") return CircleCheck;
  if (level === "info") return Info;
  return CircleAlert;
}

const onResize = () => reportVisibility(true);
const onVisibilityChange = () => reportVisibility();

onMounted(() => {
  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVisibilityChange);
  emit("region", host.value);
  reportVisibility();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  document.removeEventListener("visibilitychange", onVisibilityChange);
  emit("region", null);
});
</script>

<style scoped>
.notification-host {
  position: fixed;
  z-index: var(--expressa-z-notification-layer);
  inset: calc(16px + env(safe-area-inset-top, 0px))
    calc(16px + env(safe-area-inset-right, 0px)) auto auto;
  display: grid;
  gap: 8px;
  width: min(400px, calc(100vw - 32px));
  max-height: calc(
    100dvh - 32px - env(safe-area-inset-top, 0px) -
      env(safe-area-inset-bottom, 0px)
  );
  overflow: auto;
  pointer-events: none;
}
.notification-host__card {
  --notification-close-size: 44px;

  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) var(--notification-close-size);
  gap: 8px;
  align-items: start;
  padding: 16px;
  border-radius: 12px;
  background: white;
  box-shadow: var(--expressa-shadow-menu);
  pointer-events: auto;
}
.notification-host__card--error {
  border-inline-start: 4px solid var(--expressa-color-status-error);
  color: var(--expressa-color-status-error);
}
.notification-host__card--warning {
  border-inline-start: 4px solid var(--expressa-color-status-warning);
  color: var(--expressa-color-status-warning);
}
.notification-host__card--success {
  border-inline-start: 4px solid var(--expressa-color-status-success);
  color: var(--expressa-color-status-success);
}
.notification-host__card--info {
  border-inline-start: 4px solid var(--expressa-color-status-neutral);
  color: var(--expressa-color-text-primary);
}
.notification-host__icon {
  width: 20px;
  height: 20px;
  color: currentColor;
}
.notification-host__content {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.notification-host__card p {
  margin: 0;
  font-size: var(--expressa-font-size-status);
  line-height: 20px;
  overflow-wrap: anywhere;
}
.notification-host__card button {
  min-height: var(--expressa-size-control-min-height);
  border: 0;
  background: transparent;
  color: currentColor;
  font-size: 20px;
}
.notification-host__card button:focus-visible {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-focus-offset);
}
.notification-host__close {
  width: var(--notification-close-size);
  min-width: var(--notification-close-size);
  min-height: var(--notification-close-size);
}
@media (pointer: coarse), (max-width: 767px) {
  .notification-host__card {
    --notification-close-size: 48px;
  }
}
</style>
