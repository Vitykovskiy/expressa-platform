<template>
  <div ref="menuRoot" class="action-menu-root">
    <AdminButton
      class="action-menu-trigger"
      type="button"
      variant="ghost"
      @click="toggleMenu"
    >
      <AdminIcon :icon="MoreVertical" />
    </AdminButton>

    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="menuPanel"
        class="action-menu"
        :style="menuPosition"
      >
        <template v-for="action in props.availableActions" :key="action">
          <AdminButton
            class="action-menu-item"
            :class="`action-menu-item--${action}`"
            type="button"
            variant="ghost"
            @click="selectAction(action)"
          >
            <AdminIcon
              :icon="
                action === 'change_role'
                  ? Check
                  : action === 'unblock'
                    ? ArrowUpRight
                    : X
              "
            />
            {{ USER_ACTION_LABELS[action] }}
          </AdminButton>
          <div v-if="action === 'change_role'" class="action-menu-divider" />
        </template>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ArrowUpRight, Check, MoreVertical, X } from "lucide-vue-next";
import { onBeforeUnmount, onMounted, shallowRef } from "vue";

import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminIcon from "../../../shared/ui/admin/admin-icon/AdminIcon.vue";
import { USER_ACTION_LABELS } from "./UserActionMenu.constants";
import type {
  UserActionMenuAction,
  UserActionMenuEmits,
  UserActionMenuProps,
} from "./UserActionMenu.types";

const props = defineProps<UserActionMenuProps>();
const emit = defineEmits<UserActionMenuEmits>();
const isOpen = shallowRef(false);
const menuRoot = shallowRef<HTMLElement | null>(null);
const menuPanel = shallowRef<HTMLElement | null>(null);
const menuPosition = shallowRef({ top: "0px", right: "0px" });

function toggleMenu(): void {
  if (isOpen.value) {
    isOpen.value = false;
    return;
  }
  const bounds = menuRoot.value?.getBoundingClientRect();
  if (!bounds) return;
  menuPosition.value = {
    top: `${bounds.bottom}px`,
    right: `${window.innerWidth - bounds.right}px`,
  };
  isOpen.value = true;
}

function closeOnOutsidePointer(event: PointerEvent): void {
  const target = event.target as Node;
  if (!menuRoot.value?.contains(target) && !menuPanel.value?.contains(target)) {
    isOpen.value = false;
  }
}

function closeMenu(): void {
  isOpen.value = false;
}

onMounted(() => {
  document.addEventListener("pointerdown", closeOnOutsidePointer);
  document.addEventListener("scroll", closeMenu, true);
  window.addEventListener("resize", closeMenu);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", closeOnOutsidePointer);
  document.removeEventListener("scroll", closeMenu, true);
  window.removeEventListener("resize", closeMenu);
});

function selectAction(action: UserActionMenuAction): void {
  emit("select", action);
  isOpen.value = false;
}
</script>

<style scoped lang="scss">
.action-menu-root {
  position: relative;
}
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
.action-menu-trigger:hover {
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-surface-raised);
}
.action-menu {
  position: fixed;
  z-index: var(--expressa-z-modal-layer);
  display: grid;
  min-width: var(--expressa-size-menu-min-width);
  padding: var(--expressa-space-xs) 0;
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-panel);
  background: var(--expressa-color-surface);
  box-shadow: var(--expressa-shadow-menu);
}
.action-menu-item {
  display: flex;
  min-height: var(--expressa-size-control-min-height);
  align-items: center;
  gap: var(--expressa-space-control-block);
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
  width: var(--expressa-size-icon-action);
  height: var(--expressa-size-icon-action);
}
.action-menu-divider {
  height: var(--expressa-border-width-default);
  margin: var(--expressa-space-2xs) 0;
  background: var(--expressa-color-surface-raised);
}
.action-menu-item:hover {
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
