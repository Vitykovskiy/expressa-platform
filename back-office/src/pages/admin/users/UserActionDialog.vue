<template>
  <AdminDialog
    cancel-label="Отмена"
    :model-value="open"
    max-width="400"
    submit-form="user-action-dialog-form"
    :submit-label="presentation.confirmLabel"
    :submit-variant="presentation.confirmVariant"
    :title="presentation.title"
    @update:model-value="handleDialogUpdate"
  >
    <form
      id="user-action-dialog-form"
      class="user-action-dialog"
      @submit.prevent="confirmAction"
    >
      <p v-if="!isRoleChange" class="user-action-dialog-user">
        {{ props.user.name }}
      </p>

      <p
        :id="descriptionId"
        class="user-action-dialog-description"
        :class="{
          'user-action-dialog-description--destructive':
            props.action === 'block',
        }"
      >
        {{ presentation.description }}
      </p>

      <div v-if="isRoleChange" class="user-action-dialog-roles">
        <AdminRadioGroup v-model="selectedRole" :items="roleOptions" />
      </div>
    </form>
  </AdminDialog>
</template>

<script setup lang="ts">
import { computed, shallowRef, useId, watch } from "vue";

import { DEFAULT_ACTION_USER_ROLE } from "./UserActionDialog.constants";
import type {
  UserActionDialogEmits,
  UserActionDialogPresentation,
  UserActionDialogProps,
} from "./UserActionDialog.types";
import AdminDialog from "../../../shared/ui/admin/admin-dialog/AdminDialog.vue";
import AdminRadioGroup from "../../../shared/ui/admin/admin-radio-group/AdminRadioGroup.vue";

const props = defineProps<UserActionDialogProps>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<UserActionDialogEmits>();
const selectedRole = shallowRef(DEFAULT_ACTION_USER_ROLE);
const descriptionId = `user-action-dialog-description-${useId()}`;
const roleOptions = [
  { label: "Бариста", value: "barista" },
  { label: "Администратор", value: "administrator" },
] as const;
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
      title: "Заблокировать",
      confirmLabel: "Заблокировать",
      confirmVariant: "destructive",
      description:
        "Пользователь потеряет доступ к системе. Его данные сохранятся.",
    };
  }

  return {
    title: "Разблокировать",
    confirmLabel: "Разблокировать",
    confirmVariant: "primary",
    description: "Пользователь снова получит доступ к системе.",
  };
});
const isRoleChange = computed(() => props.action === "change_role");

function resetDraft(): void {
  selectedRole.value = props.user.role ?? DEFAULT_ACTION_USER_ROLE;
}

function closeAsCancelled(): void {
  resetDraft();
  open.value = false;
  emit("cancel");
}

function handleDialogUpdate(isOpen: boolean): void {
  if (isOpen) {
    open.value = true;
    return;
  }

  closeAsCancelled();
}

function confirmAction(): void {
  emit("confirm", isRoleChange.value ? selectedRole.value : undefined);
  resetDraft();
  open.value = false;
}

watch(open, (isOpen, wasOpen) => {
  if (isOpen && !wasOpen) {
    resetDraft();
    return;
  }

  if (!isOpen && wasOpen) {
    resetDraft();
  }
});
</script>

<style scoped lang="scss">
.user-action-dialog-description {
  margin: 0;
  padding: 0 0 var(--expressa-space-md);
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  line-height: var(--expressa-line-height-body);
  white-space: normal;
}

.user-action-dialog-user {
  margin: 0;
  padding: 0 0 var(--expressa-space-md);
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  line-height: var(--expressa-line-height-body);
  white-space: normal;
}

.user-action-dialog-description--destructive {
  margin: 0 0 var(--expressa-space-lg);
  padding: var(--expressa-space-sm) var(--expressa-space-control-inline);
  border-radius: var(--expressa-radius-sm);
  color: var(--expressa-color-status-error);
  background: var(--expressa-color-status-error-surface);
}

.user-action-dialog-roles {
  padding: 0 0 var(--expressa-space-lg);
}
</style>
