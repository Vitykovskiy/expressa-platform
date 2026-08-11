<template>
  <v-menu
    :model-value="isOpen"
    :close-on-content-click="false"
    location="bottom end"
    @update:model-value="updateOpen"
  >
    <template #activator="{ props: activatorProps }">
      <AdminButton
        ref="trigger"
        v-bind="activatorProps"
        class="action-menu-trigger"
        :aria-label="`Действия для ${props.user.name}`"
        type="button"
        variant="ghost"
      >
        <span aria-hidden="true">⋮</span>
      </AdminButton>
    </template>

    <div
      class="action-menu"
      role="menu"
      :aria-label="`Действия для ${props.user.name}`"
    >
      <template v-for="action in props.availableActions" :key="action">
        <AdminButton
          class="action-menu-item"
          :class="`action-menu-item--${action}`"
          role="menuitem"
          type="button"
          variant="ghost"
          @click="selectAction(action)"
        >
          <span class="action-menu-item__icon" aria-hidden="true">
            {{
              action === "change_role" ? "✓" : action === "unblock" ? "↗" : "×"
            }}
          </span>
          {{ USER_ACTION_LABELS[action] }}
        </AdminButton>
        <div
          v-if="action === 'change_role'"
          class="action-menu-divider"
          aria-hidden="true"
        />
      </template>
    </div>
  </v-menu>
</template>

<script setup lang="ts">
import { nextTick, shallowRef, useTemplateRef } from "vue";

import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import { USER_ACTION_LABELS } from "./UserActionMenu.constants";
import type {
  UserActionMenuAction,
  UserActionMenuEmits,
  UserActionMenuProps,
} from "./UserActionMenu.types";

const props = defineProps<UserActionMenuProps>();
const emit = defineEmits<UserActionMenuEmits>();
const isOpen = shallowRef(false);
const trigger = useTemplateRef<InstanceType<typeof AdminButton>>("trigger");

function updateOpen(value: boolean): void {
  isOpen.value = value;
  if (!value) nextTick(focusTrigger);
}

function focusTrigger(): void {
  trigger.value?.$el.focus();
}

function selectAction(action: UserActionMenuAction): void {
  emit("select", action);
  updateOpen(false);
}
</script>

<style scoped lang="scss">
.action-menu-trigger {
  display: inline-grid;
  width: var(--expressa-size-control-min-height);
  min-width: var(--expressa-size-control-min-height);
  height: var(--expressa-size-control-min-height);
  min-height: var(--expressa-size-control-min-height);
  place-items: center;
  padding: 0;
  border: var(--expressa-border-width-none);
  border-radius: var(--expressa-radius-sm);
  color: var(--expressa-color-text-muted);
  background: var(--expressa-color-transparent);
  cursor: pointer;
  font-size: var(--expressa-font-size-heading);
  line-height: var(--expressa-line-height-control);
}
.action-menu-trigger:hover,
.action-menu-trigger:focus-visible {
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-surface-raised);
}
.action-menu {
  display: grid;
  min-width: var(--expressa-size-menu-min-width);
  padding: var(--expressa-space-xs) 0;
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
  background: var(--expressa-color-surface);
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 10%),
    0 4px 6px -4px rgb(0 0 0 / 10%);
}
.action-menu-item {
  display: flex;
  min-height: 39.5px;
  align-items: center;
  gap: 10px;
  padding: var(--expressa-space-control-block)
    var(--expressa-space-control-inline);
  border: var(--expressa-border-width-none);
  border-radius: 0;
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-transparent);
  cursor: pointer;
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
  text-align: left;
}
.action-menu-item__icon {
  display: inline-grid;
  width: 14px;
  height: 14px;
  place-items: center;
  font-size: 14px;
  line-height: 1;
}
.action-menu-divider {
  height: var(--expressa-border-width-default);
  margin: 2px 0;
  background: var(--expressa-color-surface-raised);
}
.action-menu-item:hover,
.action-menu-item:focus-visible {
  background: var(--expressa-color-surface-raised);
}
.action-menu-item--block {
  color: var(--expressa-color-status-error);
}
.action-menu-item--change_role .action-menu-item__icon {
  color: var(--expressa-color-accent);
}
.action-menu-item--unblock {
  color: var(--expressa-color-status-success);
}
</style>
