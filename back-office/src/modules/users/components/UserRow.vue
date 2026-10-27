<template>
  <li class="user-row">
    <span class="user-row__avatar" :class="roleClass">{{
      props.user.initials
    }}</span>
    <div class="user-row__identity">
      <div class="user-row__labels">
        <span class="user-row__name">{{ props.user.name }}</span>
        <span class="user-row__badge" :class="roleClass">{{ roleLabel }}</span>
        <span class="user-row__badge" :class="accessBadge.className">{{
          accessBadge.label
        }}</span>
      </div>
      <p class="user-row__phone">{{ props.user.phone }}</p>
    </div>
    <VMenu v-if="hasActions" location="bottom end" :transition="false">
      <template #activator="{ props: activatorProps }">
        <button
          v-bind="activatorProps"
          type="button"
          class="user-row__trigger"
          :aria-label="`Действия: ${props.user.name}`"
          @focus="rememberTrigger"
          @click="rememberTrigger"
        >
          <img :src="USER_ASSETS.ellipsis" alt="" />
        </button>
      </template>
      <div class="user-menu" role="menu">
        <button
          v-if="props.user.canChangeRole"
          class="user-menu__action"
          type="button"
          role="menuitem"
          @click="emit('role', props.user, actionTrigger)"
        >
          <img :src="USER_ASSETS.role" alt="" />Изменить роль
        </button>
        <button
          v-if="props.user.canChangeAccess"
          class="user-menu__action"
          :class="accessAction.className"
          type="button"
          role="menuitem"
          @click="emit('access', props.user, actionTrigger)"
        >
          <img :src="accessAction.icon" alt="" />{{ accessAction.label }}
        </button>
      </div>
    </VMenu>
  </li>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { VMenu } from "vuetify/components/VMenu";
import { USER_ASSETS, USER_ROLE_LABELS } from "./Users.constants";
import type { UserRowProps, UserRowEmits } from "./UserRow.types";

const props = defineProps<UserRowProps>();
const emit = defineEmits<UserRowEmits>();
let actionTrigger: globalThis.HTMLButtonElement | null = null;

const roleLabel = computed(() => USER_ROLE_LABELS[props.user.role]);
const roleClass = computed(() => `user-role--${props.user.role}`);

const accessBadge = computed(() => {
  if (props.user.workUnavailable) {
    return { label: "Нет доступа", className: "user-access--blocked" };
  }

  return { label: "Активен", className: "user-access--active" };
});

const hasActions = computed(
  () => props.user.canChangeRole || props.user.canChangeAccess,
);

const accessAction = computed(() => {
  if (props.user.workUnavailable) {
    return {
      label: "Разблокировать",
      icon: USER_ASSETS.unblock,
      className: "user-menu__action--unblock",
    };
  }

  return {
    label: "Заблокировать",
    icon: USER_ASSETS.block,
    className: "user-menu__action--block",
  };
});

function rememberTrigger(event: globalThis.Event) {
  const trigger = event.currentTarget;

  if (trigger instanceof globalThis.HTMLButtonElement) {
    actionTrigger = trigger;
  }
}
</script>

<style scoped>
/* Локальные размеры строки, текста и меню не имеют шкал в теме.
   Цвет разделителей сохраняет исходное оформление: подходящего token нет. */
.user-row {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
}
.user-row:last-child {
  border-bottom: 0;
}
.user-row__avatar {
  display: flex;
  flex: 0 0 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: var(--operations-radius-pill);
  font:
    600 12px/16px Inter,
    sans-serif;
}
.user-row__identity {
  flex: 1;
  min-width: 0;
}
.user-row__labels {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
}
.user-row__name {
  color: var(--color-foreground);
  font:
    600 14px/20px Inter,
    sans-serif;
  overflow-wrap: anywhere;
}
.user-row__badge {
  display: inline-flex;
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: var(--operations-radius-pill);
  font:
    500 11px/16.5px Inter,
    sans-serif;
}
.user-role--administrator {
  color: var(--color-primary);
  background: var(--operations-created-surface);
}
.user-role--barista,
.user-access--active {
  color: var(--operations-confirmed-foreground);
  background: var(--operations-confirmed-surface);
}
.user-access--blocked {
  color: var(--color-danger);
  background: var(--operations-danger-surface);
}
.user-row__phone {
  margin: 2px 0 0;
  color: var(--color-foreground-muted);
  font:
    400 12px/16px Inter,
    sans-serif;
  overflow-wrap: anywhere;
}
.user-row__trigger {
  display: flex;
  flex: 0 0 28px;
  padding: 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}
.user-menu {
  width: 192px;
  padding-block: 4px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  font:
    400 13px/19.5px Inter,
    sans-serif;
}
.user-menu__action {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.user-menu__action + .user-menu__action {
  border-top: 1px solid #f0f0f0;
}
.user-menu__action--block {
  color: var(--color-danger);
}
.user-menu__action--unblock {
  color: var(--operations-confirmed-foreground);
}
</style>
