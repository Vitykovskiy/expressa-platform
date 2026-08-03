<template>
  <AdminDialog
    :aria-describedby="descriptionId"
    :aria-labelledby="titleId"
    :model-value="open"
    max-width="400"
    @update:model-value="handleDialogUpdate"
  >
    <v-card class="user-action-dialog">
      <v-card-title :id="titleId" class="user-action-dialog-title">
        {{ presentation.title }}
      </v-card-title>

      <v-card-text v-if="!isRoleChange" class="user-action-dialog-user">
        <strong>{{ props.user.name }}</strong>
        <span v-if="props.user.phone">{{ props.user.phone }}</span>
      </v-card-text>

      <v-card-text
        :id="descriptionId"
        class="user-action-dialog-description"
        :class="{
          'user-action-dialog-description--destructive':
            props.action === 'block',
        }"
      >
        {{ presentation.description }}
      </v-card-text>

      <v-card-text v-if="isRoleChange" class="user-action-dialog-roles">
        <fieldset :id="roleGroupId" class="user-action-dialog-role-group">
          <legend class="user-action-dialog-role-legend">Роль</legend>
          <label class="user-action-dialog-role-option">
            <input
              v-model="selectedRole"
              name="user-role"
              type="radio"
              value="barista"
            />
            <span>
              <strong>Бариста</strong>
              <small>Заказы и доступность</small>
            </span>
          </label>
          <label class="user-action-dialog-role-option">
            <input
              v-model="selectedRole"
              name="user-role"
              type="radio"
              value="administrator"
            />
            <span>
              <strong>Администратор</strong>
              <small>Полный доступ</small>
            </span>
          </label>
        </fieldset>
      </v-card-text>

      <v-card-actions class="user-action-dialog-actions admin-dialog-actions">
        <AdminButton
          :variant="presentation.confirmVariant"
          @click="confirmAction"
        >
          {{ presentation.confirmLabel }}
        </AdminButton>
        <AdminButton variant="ghost" @click="closeAsCancelled">
          Отмена
        </AdminButton>
      </v-card-actions>
    </v-card>
  </AdminDialog>
</template>

<script setup lang="ts">
import { computed, nextTick, shallowRef, useId, watch } from "vue";

import { DEFAULT_ACTION_USER_ROLE } from "./UserActionDialog.constants";
import type {
  FocusableElement,
  UserActionDialogEmits,
  UserActionDialogPresentation,
  UserActionDialogProps,
} from "./UserActionDialog.types";
import AdminButton from "../../shared/ui/admin-button/AdminButton.vue";
import AdminDialog from "../../shared/ui/admin-dialog/AdminDialog.vue";

const props = defineProps<UserActionDialogProps>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<UserActionDialogEmits>();
const selectedRole = shallowRef(DEFAULT_ACTION_USER_ROLE);
const returnFocusTarget = shallowRef<FocusableElement | null>(null);
const titleId = `user-action-dialog-title-${useId()}`;
const descriptionId = `user-action-dialog-description-${useId()}`;
const roleGroupId = `user-action-dialog-role-${useId()}`;
const presentation = computed<UserActionDialogPresentation>(() => {
  if (props.action === "change_role") {
    return {
      title: "Изменить роль",
      confirmLabel: "Назначить",
      confirmVariant: "primary",
      description: props.user.name,
    };
  }

  if (props.action === "block") {
    return {
      title: "Заблокировать пользователя?",
      confirmLabel: "Заблокировать",
      confirmVariant: "destructive",
      description:
        "Пользователь потеряет доступ к системе. Его данные сохранятся.",
    };
  }

  return {
    title: "Разблокировать пользователя?",
    confirmLabel: "Разблокировать",
    confirmVariant: "primary",
    description: "Пользователь снова получит доступ к системе.",
  };
});
const isRoleChange = computed(() => props.action === "change_role");

function resetDraft() {
  selectedRole.value = DEFAULT_ACTION_USER_ROLE;
}

function closeAsCancelled() {
  resetDraft();
  open.value = false;
  emit("cancel");
}

function handleDialogUpdate(isOpen: boolean) {
  if (isOpen) {
    open.value = true;
    return;
  }

  closeAsCancelled();
}

function confirmAction() {
  emit("confirm", isRoleChange.value ? selectedRole.value : undefined);
  resetDraft();
  open.value = false;
}

function isFocusableElement(value: unknown): value is FocusableElement {
  return (
    typeof value === "object" &&
    value !== null &&
    "focus" in value &&
    typeof value.focus === "function"
  );
}

watch(open, (isOpen, wasOpen) => {
  if (isOpen && !wasOpen) {
    const activeElement = globalThis.document?.activeElement;
    returnFocusTarget.value = isFocusableElement(activeElement)
      ? activeElement
      : null;
    return;
  }

  if (!isOpen && wasOpen) {
    resetDraft();
    const focusTarget = returnFocusTarget.value;
    returnFocusTarget.value = null;

    if (focusTarget) {
      void nextTick(() => focusTarget.focus());
    }
  }
});
</script>

<style scoped lang="scss">
.user-action-dialog {
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
}

.user-action-dialog-title {
  padding: var(--expressa-space-lg) var(--expressa-space-lg)
    var(--expressa-space-sm);
  font-size: var(--expressa-font-size-title);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: var(--expressa-line-height-title);
  white-space: normal;
}

.user-action-dialog-description {
  padding: 0 var(--expressa-space-lg) var(--expressa-space-md);
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-body);
  line-height: var(--expressa-line-height-body);
  white-space: normal;
}

.user-action-dialog-user {
  display: grid;
  gap: var(--expressa-space-2xs);
  padding: 0 var(--expressa-space-lg) var(--expressa-space-sm);
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-body);
  line-height: var(--expressa-line-height-body);
  white-space: normal;
}

.user-action-dialog-description--destructive {
  margin: 0 var(--expressa-space-lg) var(--expressa-space-md);
  padding: var(--expressa-space-sm) var(--expressa-space-control-inline);
  border-radius: var(--expressa-radius-sm);
  color: var(--expressa-color-status-error);
  background: var(--expressa-color-status-error-surface);
}

.user-action-dialog-roles {
  padding: 0 var(--expressa-space-lg) var(--expressa-space-md);
}

.user-action-dialog-role-group {
  display: grid;
  gap: var(--expressa-space-sm);
  margin: 0;
  padding: 0;
  border: var(--expressa-border-width-none);
}

.user-action-dialog-role-legend {
  padding: 0;
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
}

.user-action-dialog-role-option {
  display: flex;
  min-height: var(--expressa-size-role-option-min-height);
  align-items: center;
  gap: var(--expressa-space-control-inline);
  padding: var(--expressa-space-control-block)
    var(--expressa-space-control-inline);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
  cursor: pointer;
}

.user-action-dialog-role-option:has(input:checked) {
  border-color: var(--expressa-color-accent);
  background: var(--expressa-color-status-info-surface);
}

.user-action-dialog-role-option input {
  width: var(--expressa-size-checkbox);
  height: var(--expressa-size-checkbox);
  margin: 0;
  accent-color: var(--expressa-color-accent);
}

.user-action-dialog-role-option span {
  display: grid;
  gap: var(--expressa-space-2xs);
}

.user-action-dialog-role-option strong {
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-body);
}

.user-action-dialog-role-option small {
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
}

.user-action-dialog-actions {
  padding: 0 var(--expressa-space-lg) var(--expressa-space-lg);
}
</style>
