<template>
  <AdminDialog
    :aria-labelledby="titleId"
    cancel-label="Отмена"
    :model-value="open"
    max-width="448"
    submit-form="add-user-dialog-form"
    :submit-disabled="!isValid"
    submit-label="Сохранить"
    title="Новый пользователь"
    @after-enter="focusNameField"
    @update:model-value="handleDialogUpdate"
  >
    <form
      id="add-user-dialog-form"
      class="add-user-dialog-form"
      @submit.prevent="addUser"
    >
      <AdminFieldWrapper :id="nameId" v-slot="field" label="Имя" required>
        <AdminTextField
          :id="field.controlId"
          ref="nameField"
          v-model="name"
          :aria-describedby="field.describedBy"
          :aria-invalid="field.invalid"
          :aria-required="field.required"
          autocomplete="name"
          :required="field.required"
          type="text"
        />
      </AdminFieldWrapper>

      <AdminFieldWrapper :id="phoneId" v-slot="field" label="Телефон" required>
        <AdminTextField
          :id="field.controlId"
          :model-value="phone"
          :aria-describedby="field.describedBy"
          :aria-invalid="field.invalid"
          :aria-required="field.required"
          autocomplete="tel"
          inputmode="tel"
          :required="field.required"
          type="tel"
          @update:model-value="updatePhone"
        />
      </AdminFieldWrapper>

      <AdminFieldWrapper :id="roleId" v-slot="field" label="Роль">
        <AdminRadioGroup
          :id="field.controlId"
          v-model="role"
          :aria-describedby="field.describedBy"
          :aria-invalid="field.invalid"
          :aria-required="field.required"
          aria-label="Роль"
          :items="roleOptions"
        />
      </AdminFieldWrapper>
    </form>
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
import AdminDialog from "../../../shared/ui/admin/admin-dialog/AdminDialog.vue";
import AdminFieldWrapper from "../../../shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
import AdminRadioGroup from "../../../shared/ui/admin/admin-radio-group/AdminRadioGroup.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";

const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<AddUserDialogEmits>();
const name = shallowRef("");
const phone = shallowRef("");
const role = shallowRef(DEFAULT_NEW_USER_ROLE);
const roleOptions = [
  { label: "Бариста", value: "barista" },
  { label: "Администратор", value: "administrator" },
] as const;
const returnFocusTarget = shallowRef<FocusableElement | null>(null);
const nameField =
  useTemplateRef<InstanceType<typeof AdminTextField>>("nameField");
const titleId = `add-user-dialog-title-${useId()}`;
const nameId = `add-user-dialog-name-${useId()}`;
const phoneId = `add-user-dialog-phone-${useId()}`;
const roleId = `add-user-dialog-role-${useId()}`;
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
.add-user-dialog-form {
  display: grid;
  gap: var(--expressa-space-md);
}
</style>
