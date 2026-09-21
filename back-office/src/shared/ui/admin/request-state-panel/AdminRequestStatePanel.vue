<template>
  <section class="request-state-panel" :role="announcementRole">
    <div class="request-state-panel__heading">
      <span class="request-state-panel__icon" aria-hidden="true">!</span>
      <div>
        <h2 ref="titleElement" class="request-state-panel__title" tabindex="-1">
          {{ props.title }}
        </h2>
        <p class="request-state-panel__body">{{ props.body }}</p>
      </div>
    </div>

    <AdminButton :disabled="props.pending" @click="emit('action')">
      {{ props.pending ? props.pendingLabel : props.actionLabel }}
    </AdminButton>

    <details v-if="hasDiagnostics" class="request-state-panel__details">
      <summary>{{ props.disclosureLabel }}</summary>
      <dl class="request-state-panel__diagnostics">
        <template v-if="props.code">
          <dt>Код ошибки</dt>
          <dd>{{ props.code }}</dd>
        </template>
        <template v-if="props.requestId">
          <dt>Код запроса</dt>
          <dd class="request-state-panel__request-id">{{ props.requestId }}</dd>
        </template>
      </dl>
      <AdminButton
        class="request-state-panel__copy"
        variant="ghost"
        @click="copyDiagnostics"
      >
        {{ copied ? "Сведения скопированы" : "Скопировать сведения" }}
      </AdminButton>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, shallowRef, useTemplateRef } from "vue";
import AdminButton from "../admin-button/AdminButton.vue";
import { ADMIN_REQUEST_STATE_PANEL_DEFAULTS } from "./AdminRequestStatePanel.constants";
import type {
  AdminRequestStatePanelEmits,
  AdminRequestStatePanelProps,
} from "./AdminRequestStatePanel.types";

const props = withDefaults(
  defineProps<AdminRequestStatePanelProps>(),
  ADMIN_REQUEST_STATE_PANEL_DEFAULTS,
);
const emit = defineEmits<AdminRequestStatePanelEmits>();
const titleElement = useTemplateRef<HTMLHeadingElement>("titleElement");
const copied = shallowRef(false);
const hasDiagnostics = computed(() => Boolean(props.code || props.requestId));
const announcementRole = computed(() =>
  props.announcementMode === "none" ? undefined : props.announcementMode,
);

function diagnosticsText(): string {
  return [
    props.code ? `Код ошибки: ${props.code}` : "",
    props.requestId ? `Код запроса: ${props.requestId}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function copyDiagnostics(): Promise<void> {
  try {
    await globalThis.navigator?.clipboard?.writeText(diagnosticsText());
    copied.value = true;
    emit("copied");
  } catch {
    copied.value = false;
  }
}

onMounted(() => {
  if (props.focusOnAppear) titleElement.value?.focus();
});
</script>

<style scoped lang="scss">
.request-state-panel {
  width: min(100%, 720px);
  padding: var(--expressa-space-24);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-panel);
  background: var(--expressa-color-surface);
}

.request-state-panel__heading {
  display: flex;
  gap: var(--expressa-space-12);
  margin-bottom: var(--expressa-space-16);
}
.request-state-panel__icon {
  display: grid;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  place-items: center;
  border-radius: 50%;
  color: var(--expressa-color-text-on-accent);
  background: var(--expressa-color-status-neutral);
  font-weight: var(--expressa-font-weight-bold);
}
.request-state-panel__title {
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-title);
  line-height: var(--expressa-line-height-title);
}
.request-state-panel__title:focus-visible {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-focus-offset);
}
.request-state-panel__body {
  margin: var(--expressa-space-8) 0 0;
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-body);
  line-height: var(--expressa-line-height-body);
}
.request-state-panel__details {
  margin-top: var(--expressa-space-16);
  color: var(--expressa-color-text-secondary);
}
.request-state-panel__details > summary {
  min-height: var(--expressa-size-control-min-height);
  cursor: pointer;
}
.request-state-panel__diagnostics {
  display: grid;
  gap: var(--expressa-space-4);
  margin: var(--expressa-space-12) 0;
}
.request-state-panel__diagnostics dt {
  font-weight: var(--expressa-font-weight-semibold);
}
.request-state-panel__diagnostics dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.request-state-panel__request-id {
  font-family: ui-monospace, monospace;
}
.request-state-panel__copy {
  padding-inline: 0;
}

@media (max-width: 479px) {
  .request-state-panel > .admin-button {
    width: 100%;
  }
}
</style>
