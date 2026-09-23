<template>
  <section ref="host" class="notification-host">
    <article
      v-for="entry in entries"
      :key="entry.id"
      class="notification-host__card"
      :class="`notification-host__card--${entry.level}`"
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
        @click="dismiss(entry.id)"
      >
        <X />
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
const host = ref<HTMLElement | null>(null);
let lastCandidateSignature: readonly string[] = [];
let lastStackFits = true;
let lastVisibility: NotificationHostVisibility | undefined;

const props = defineProps<NotificationHostProps>();
const emit = defineEmits<{
  dismiss: [id: string];
  recover: [id: string];
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

function dismiss(id: string): void {
  emit("dismiss", id);
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
  reportVisibility();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  document.removeEventListener("visibilitychange", onVisibilityChange);
});
</script>

<style scoped>
.notification-host {
  position: fixed;
  z-index: var(--expressa-z-notification-layer);
  inset: calc(
      var(--expressa-space-48) + var(--expressa-space-md) +
        var(--expressa-safe-area-top)
    )
    var(--expressa-space-md) auto auto;
  display: grid;
  gap: var(--expressa-space-sm);
  width: min(25rem, calc(100vw - var(--expressa-space-32)));
  max-height: calc(
    100dvh - var(--expressa-space-32) - var(--expressa-safe-area-top) -
      var(--expressa-safe-area-bottom)
  );
  overflow: auto;
  pointer-events: none;
}
.notification-host__card {
  --notification-close-size: var(--expressa-size-control-min-height);

  display: grid;
  grid-template-columns: var(--expressa-size-icon-action) minmax(0, 1fr) var(
      --notification-close-size
    );
  gap: var(--expressa-space-sm);
  align-items: start;
  padding: var(--expressa-space-12) var(--expressa-space-md);
  border-radius: var(--expressa-radius-md);
  background: var(--expressa-color-surface);
  box-shadow: var(--expressa-shadow-menu);
  pointer-events: auto;
}
.notification-host__card--error {
  border-inline-start: var(--expressa-space-4) solid
    var(--expressa-color-status-error);
  color: var(--expressa-color-status-error);
  background: var(--expressa-color-status-error-surface);
}
.notification-host__card--warning {
  border-inline-start: var(--expressa-space-4) solid
    var(--expressa-color-status-warning);
  color: var(--expressa-color-status-warning);
  background: var(--expressa-color-status-warning-surface);
}
.notification-host__card--success {
  border-inline-start: var(--expressa-space-4) solid
    var(--expressa-color-status-success);
  color: var(--expressa-color-status-success);
  background: var(--expressa-color-status-success-surface);
}
.notification-host__card--info {
  border-inline-start: var(--expressa-space-4) solid
    var(--expressa-color-accent);
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-status-info-surface);
}
.notification-host__icon {
  width: var(--expressa-size-icon-action);
  height: var(--expressa-size-icon-action);
  color: currentColor;
}
.notification-host__content {
  display: grid;
  gap: var(--expressa-space-sm);
  min-width: 0;
}
.notification-host__card p {
  margin: 0;
  font-size: var(--expressa-font-size-status);
  line-height: var(--expressa-line-height-caption-compact);
  overflow-wrap: anywhere;
}
.notification-host__card button {
  min-height: var(--expressa-size-control-min-height);
  border: var(--expressa-border-width-none);
  background: var(--expressa-color-transparent);
  color: currentColor;
  font-size: var(--expressa-font-size-action);
}
.notification-host__close {
  width: var(--notification-close-size);
  min-width: var(--notification-close-size);
  min-height: var(--notification-close-size);
}
@media (pointer: coarse), (max-width: 767px) {
  .notification-host__card {
    --notification-close-size: var(--expressa-size-control-coarse-min-height);
  }
}
</style>
