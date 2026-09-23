<template>
  <section class="request-state-panel">
    <h2 v-if="!props.pending" class="request-state-panel__title">
      {{ props.title }}
    </h2>
    <AdminButton
      v-if="!props.pending"
      :disabled="props.pending"
      type="button"
      @click="emit('action')"
    >
      {{ props.actionLabel }}
    </AdminButton>
    <p v-else class="request-state-panel__pending">
      {{ props.pendingLabel }}
    </p>
  </section>
</template>

<script setup lang="ts">
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
</script>

<style scoped lang="scss">
.request-state-panel {
  display: grid;
  gap: var(--expressa-space-16);
  width: min(100%, var(--expressa-size-users-content-max-width));
  padding: var(--expressa-space-24);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-panel);
  background: var(--expressa-color-surface);
}

.request-state-panel__title {
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-title);
  line-height: var(--expressa-line-height-title);
}
.request-state-panel__pending {
  margin: 0;
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  line-height: var(--expressa-line-height-body);
}
@media (max-width: 479px) {
  .request-state-panel > .admin-button {
    width: 100%;
  }
}
</style>
