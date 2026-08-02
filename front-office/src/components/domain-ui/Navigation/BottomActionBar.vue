<template>
  <div class="bottom-action-bar">
    <span class="bottom-action-bar-content">
      <b class="bottom-action-bar-label">{{ label }}</b>
      <small v-if="detail" class="bottom-action-bar-detail">{{ detail }}</small>
    </span>
    <UiButton :disabled="disabled" @click="emit('action')">Продолжить</UiButton>
  </div>
</template>

<script setup lang="ts">
import UiButton from "../../../shared/ui/UiButton.vue";

defineOptions({ name: "FoBottomActionBar" });

defineProps<{ label: string; detail?: string; disabled?: boolean }>();
const emit = defineEmits<{ action: [] }>();
</script>

<style scoped>
.bottom-action-bar {
  display: flex;
  position: sticky;
  bottom: 0;
  align-items: center;
  justify-content: space-between;
  gap: var(--fo-space-3);
  padding: var(--fo-space-3);
  border-top: 1px solid var(--fo-border);
  background: var(--fo-surface);
  box-shadow: var(--fo-shadow-md);
  font: 400 1rem/1.2 var(--fo-font);
}

.bottom-action-bar-content {
  display: grid;
  min-width: 0;
  gap: var(--fo-space-1);
}

.bottom-action-bar-label,
.bottom-action-bar-detail {
  overflow-wrap: anywhere;
}

.bottom-action-bar-detail {
  color: var(--fo-muted);
}
</style>
