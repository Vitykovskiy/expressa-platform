<template>
  <AdminDialog
    :aria-describedby="descriptionId"
    :aria-labelledby="titleId"
    :model-value="open"
    max-width="448"
    @after-enter="focusNameField"
    @update:model-value="handleDialogUpdate"
  >
    <v-card class="add-user-dialog">
      <v-card-title :id="titleId" class="add-user-dialog-title">
        Новый пользователь
      </v-card-title>
      <v-card-text :id="descriptionId" class="add-user-dialog-description">
        Добавьте нового сотрудника
      </v-card-text>

      <form class="add-user-dialog-form" @submit.prevent="addUser">
        <label class="add-user-dialog-field" :for="nameId">
          <span>Имя</span>
          <AdminTextField
            :id="nameId"
            ref="nameField"
            v-model="name"
            autocomplete="name"
            placeholder="Например: Иван Петров"
            required
            type="text"
          />
        </label>

        <label class="add-user-dialog-field" :for="phoneId">
          <span>Телефон</span>
          <AdminTextField
            :id="phoneId"
            :model-value="phone"
            autocomplete="tel"
            inputmode="tel"
            placeholder="+7 900 000-00-00"
            required
            type="tel"
            @update:model-value="updatePhone"
          />
        </label>

        <div class="add-user-dialog-field">
          <label :for="roleId">Роль</label>
          <AdminSelect
            :id="roleId"
            v-model="role"
            :aria-describedby="roleHelpId"
          >
            <option value="barista">Бариста</option>
            <option value="administrator">Администратор</option>
          </AdminSelect>
          <small :id="roleHelpId"
            >Администраторы имеют полный доступ ко всем функциям</small
          >
        </div>

        <div class="add-user-dialog-actions">
          <AdminButton :disabled="!isValid" type="submit">
            Добавить пользователя
          </AdminButton>
          <AdminButton variant="ghost" @click="closeAsCancelled">
            Отмена
          </AdminButton>
        </div>
      </form>
    </v-card>
  </AdminDialog>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  shallowRef,
  useId,
  useTemplateRef,
  watch,
} from "vue";

import { DEFAULT_NEW_USER_ROLE } from "./AddUserDialog.constants";
import type {
  AddUserDialogEmits,
  FocusableElement,
} from "./AddUserDialog.types";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminDialog from "../../../shared/ui/admin/admin-dialog/AdminDialog.vue";
import AdminSelect from "../../../shared/ui/admin/admin-select/AdminSelect.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";

const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<AddUserDialogEmits>();
const name = shallowRef("");
const phone = shallowRef("");
const role = shallowRef(DEFAULT_NEW_USER_ROLE);
const returnFocusTarget = shallowRef<FocusableElement | null>(null);
const nameField =
  useTemplateRef<InstanceType<typeof AdminTextField>>("nameField");
const titleId = `add-user-dialog-title-${useId()}`;
const descriptionId = `add-user-dialog-description-${useId()}`;
const nameId = `add-user-dialog-name-${useId()}`;
const phoneId = `add-user-dialog-phone-${useId()}`;
const roleId = `add-user-dialog-role-${useId()}`;
const roleHelpId = `add-user-dialog-role-help-${useId()}`;
const isValid = computed(
  () =>
    Boolean(name.value.trim()) && phone.value.replace(/\D/g, "").length >= 11,
);

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  let formatted = "+7";

  if (digits.length > 1) {
    formatted += ` ${digits.slice(1, 4)}`;
  }

  if (digits.length > 4) {
    formatted += ` ${digits.slice(4, 7)}`;
  }

  if (digits.length > 7) {
    formatted += `-${digits.slice(7, 9)}`;
  }

  if (digits.length > 9) {
    formatted += `-${digits.slice(9, 11)}`;
  }

  return formatted;
}

function resetDraft(): void {
  name.value = "";
  phone.value = "";
  role.value = DEFAULT_NEW_USER_ROLE;
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

function updatePhone(value: string): void {
  phone.value = formatPhone(value);
}

function addUser(): void {
  if (!isValid.value) {
    return;
  }

  emit("add", {
    name: name.value.trim(),
    phone: phone.value.trim(),
    role: role.value,
  });
  resetDraft();
  open.value = false;
}

function focusNameField(): void {
  nameField.value?.focus();
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
.add-user-dialog {
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
}

.add-user-dialog-title {
  padding: var(--expressa-space-lg) var(--expressa-space-lg)
    var(--expressa-space-xs);
  font-size: var(--expressa-font-size-title);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: 28px;
  white-space: normal;
}

.add-user-dialog-description {
  padding: 0 var(--expressa-space-lg) 20px;
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-body);
  line-height: 20px;
  white-space: normal;
}

.add-user-dialog-form {
  display: grid;
  gap: var(--expressa-space-md);
  padding: 0 var(--expressa-space-lg);
}

.add-user-dialog-field {
  display: grid;
  gap: var(--expressa-space-field-label);
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
}

.add-user-dialog-field small {
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
  font-weight: var(--expressa-font-weight-regular);
  line-height: var(--expressa-line-height-caption-compact);
}

.add-user-dialog-actions {
  display: grid;
  gap: var(--expressa-space-sm);
  margin-top: var(--expressa-space-sm);
}

.add-user-dialog-actions > .admin-button {
  width: 100%;
}
</style>
