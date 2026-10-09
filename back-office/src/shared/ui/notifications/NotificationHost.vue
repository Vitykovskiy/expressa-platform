<template>
  <Teleport to="body">
    <section
      v-bind="$attrs"
      ref="host"
      class="notification-host"
      :class="{ 'notification-host--visible': entries.length > 0 }"
    >
      <article
        v-for="entry in entries"
        :key="entry.id"
        class="notification-host__card"
        :class="`notification-host__card--${entry.level}`"
        @pointerenter="setHovered(entry.id)"
        @pointerleave="setHovered(null)"
      >
        <AdminIcon
          class="notification-host__icon"
          :icon="iconFor(entry.level)"
        />
        <div class="notification-host__content">
          <p>
            {{ entry.message
            }}<span v-if="entry.accounting !== undefined">
              · {{ entry.accounting }}</span
            >
          </p>
          <AdminButton
            v-if="entry.actionLabel !== undefined"
            class="notification-host__recovery"
            size="compact"
            type="button"
            variant="secondary"
            :disabled="entry.busy"
            @click="$emit('recover', entry.id)"
          >
            <span class="notification-host__action-label">{{
              entry.actionLabel
            }}</span>
          </AdminButton>
        </div>
        <AdminButton
          size="compact"
          type="button"
          variant="ghost"
          :disabled="entry.busy"
          @click="dismiss(entry.id)"
        >
          <AdminIcon :icon="X" />
        </AdminButton>
      </article>
    </section>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { CircleAlert, CircleCheck, Info, X } from "lucide-vue-next";
import AdminButton from "../admin/admin-button/AdminButton.vue";
import AdminIcon from "../admin/admin-icon/AdminIcon.vue";
import type {
  NotificationHostProps,
  NotificationHostVisibility,
} from "./NotificationHost.types";
import {
  publishNotificationBand,
  releaseNotificationBand,
} from "./notification-layout";

defineOptions({ inheritAttrs: false });

const hoveredId = ref<string | null>(null);
const host = ref<HTMLElement | null>(null);
let lastCandidateSignature: readonly string[] = [];
let lastStackFits = true;
let lastVisibility: NotificationHostVisibility | undefined;
const layoutOwner = Symbol("notification-host-layout");
let resizeObserver: ResizeObserver | undefined;

const props = defineProps<NotificationHostProps>();
const emit = defineEmits<{
  dismiss: [id: string];
  recover: [id: string];
  visibility: [visibility: NotificationHostVisibility];
}>();

function publishLayout(): void {
  const element = host.value;
  if (element === null || props.entries.length === 0) {
    releaseNotificationBand(layoutOwner);
    return;
  }
  const bounds = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  const gutter = Number.parseFloat(styles.rowGap) || 0;
  publishNotificationBand(
    layoutOwner,
    Math.min(window.innerHeight, Math.max(0, bounds.bottom + gutter)),
  );
}

function reportVisibility(forceMeasurement = false): void {
  publishLayout();
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
      `${entry.id}:${entry.level}:${entry.busy}:${entry.actionLabel ?? ""}:${entry.message}:${entry.accounting ?? ""}`,
  );
  const visibleSignature = props.entries.map(
    (entry) =>
      `${entry.id}:${entry.level}:${entry.busy}:${entry.actionLabel ?? ""}:${entry.message}:${entry.accounting ?? ""}`,
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
  resizeObserver = new ResizeObserver(publishLayout);
  if (host.value !== null) resizeObserver.observe(host.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  releaseNotificationBand(layoutOwner);
  window.removeEventListener("resize", onResize);
  document.removeEventListener("visibilitychange", onVisibilityChange);
});
</script>

<style scoped>
.notification-host {
  position: fixed;
  z-index: var(--expressa-z-notification-layer);
  inset-block-start: calc(
    var(--expressa-safe-area-top) + var(--expressa-space-md)
  );
  inset-inline-start: max(
    var(--expressa-space-md),
    var(--expressa-safe-area-left)
  );
  inset-inline-end: max(
    var(--expressa-space-md),
    var(--expressa-safe-area-right)
  );
  display: grid;
  gap: var(--expressa-space-sm);
  width: auto;
  max-width: var(--expressa-size-notification-max-inline);
  height: 0;
  max-height: var(--expressa-size-notification-desktop-max-block);
  margin-inline: auto;
  overflow: hidden;
  pointer-events: none;
}
.notification-host--visible {
  height: auto;
  overflow-y: auto;
  overscroll-behavior-y: contain;
}
.notification-host__card {
  --notification-close-size: var(--expressa-size-control-min-height);
  --notification-accent: var(--expressa-color-accent);

  display: grid;
  grid-template-columns: var(--expressa-size-icon-action) minmax(0, 1fr) var(
      --notification-close-size
    );
  gap: var(--expressa-space-sm);
  align-items: start;
  padding: var(--expressa-space-12) var(--expressa-space-md);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-inline-start: var(--expressa-space-4) solid var(--notification-accent);
  border-radius: var(--expressa-radius-md);
  background: var(--expressa-color-surface);
  color: var(--expressa-color-text-primary);
  box-shadow: var(--expressa-shadow-notification);
  pointer-events: auto;
}
.notification-host__icon {
  margin-block-start: var(--expressa-space-2xs);
  color: var(--notification-accent);
}
.notification-host__card--error {
  --notification-accent: var(--expressa-color-status-error);
}
.notification-host__card--warning {
  --notification-accent: var(--expressa-color-status-warning);
}
.notification-host__card--success {
  --notification-accent: var(--expressa-color-status-success);
}
.notification-host__content {
  display: grid;
  gap: var(--expressa-space-sm);
  min-width: 0;
}
.notification-host__card p {
  margin: 0;
  font-size: var(--expressa-font-size-action);
  line-height: var(--expressa-line-height-body);
  overflow-wrap: anywhere;
}
.notification-host__recovery {
  justify-self: start;
  min-width: 0;
  max-width: 100%;
}
.notification-host__action-label {
  min-width: 0;
  overflow-wrap: anywhere;
}
@media (pointer: coarse), (max-width: 767px) {
  .notification-host__card {
    --notification-close-size: var(--expressa-size-control-coarse-min-height);
  }
}
@media (max-width: 767px) {
  .notification-host {
    inset-block-start: calc(
      var(--expressa-safe-area-top) + var(--expressa-space-sm)
    );
    max-height: var(--expressa-size-notification-mobile-max-block);
  }
}
</style>
