<template>
  <form class="auth-step" @submit.prevent="emit('submit')">
    <AdminFieldWrapper
      id="auth-phone"
      v-slot="field"
      :error="error"
      label="Телефон"
      required
    >
      <AdminTextField
        :id="field.controlId"
        :model-value="displayedPhone"
        autocomplete="tel"
        inputmode="tel"
        name="phone"
        placeholder="+7 900 000-00-00"
        :required="field.required"
        type="tel"
        @beforeinput="rememberSelection"
        @input="updatePhone"
      >
        <template #prepend><AdminIcon :icon="Phone" size="field" /></template>
      </AdminTextField>
    </AdminFieldWrapper>
    <AdminButton class="auth-step__button" :disabled="!valid" type="submit">
      Отправить код
    </AdminButton>
  </form>
</template>

<script setup lang="ts">
import { Phone } from "lucide-vue-next";
import { computed } from "vue";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminIcon from "../../../shared/ui/admin/admin-icon/AdminIcon.vue";
import AdminFieldWrapper from "../../../shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";

import type { PhoneStepEmits, PhoneStepProps } from "./PhoneStep.types";
import { formatPhone } from "./phone-format";

const props = defineProps<PhoneStepProps>();

const emit = defineEmits<PhoneStepEmits>();
const displayedPhone = computed(() => formatPhone(props.phone));

let previousSelection = { value: "", start: 0, end: 0 };

function rememberSelection(event: InputEvent): void {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  previousSelection = {
    value: input.value,
    start: input.selectionStart ?? 0,
    end: input.selectionEnd ?? 0,
  };
}

function updatePhone(event: Event): void {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;

  const raw = input.value;
  let digits = raw.replace(/\D/g, "");
  let cursorDigits = raw
    .slice(0, input.selectionStart ?? raw.length)
    .replace(/\D/g, "").length;
  const inputType = event instanceof InputEvent ? event.inputType : "";
  const isDeletion = inputType.startsWith("delete");
  const collapsed = previousSelection.start === previousSelection.end;
  const deletionStart =
    collapsed && inputType === "deleteContentBackward"
      ? previousSelection.start - 1
      : previousSelection.start;
  const deletionEnd =
    collapsed && inputType === "deleteContentForward"
      ? previousSelection.end + 1
      : previousSelection.end;
  const deletesCountryDigit =
    isDeletion && deletionStart <= 1 && deletionEnd > 1;

  // Deleting a separator also deletes the adjacent digit instead of restoring it.
  if (
    collapsed &&
    digits === previousSelection.value.replace(/\D/g, "") &&
    (inputType === "deleteContentBackward" ||
      inputType === "deleteContentForward")
  ) {
    const before = previousSelection.value
      .slice(0, previousSelection.start)
      .replace(/\D/g, "").length;
    const index = inputType === "deleteContentBackward" ? before - 1 : before;
    if (index > 0) {
      digits = digits.slice(0, index) + digits.slice(index + 1);
      cursorDigits = index;
    }
  }

  // The country prefix stays fixed while editing the national part.
  if (
    previousSelection.value.startsWith("+7") &&
    (deletesCountryDigit || (raw.startsWith("+") && !digits.startsWith("7"))) &&
    digits
  ) {
    digits = `7${digits}`;
    cursorDigits += 1;
  }
  const hasCountryPrefix =
    raw.startsWith("+") ||
    (isDeletion && previousSelection.value.startsWith("+7"));
  const formatted = formatPhone(hasCountryPrefix ? `+${digits}` : digits);
  cursorDigits += Math.max(
    0,
    formatted.replace(/\D/g, "").length - digits.length,
  );
  const digitPositions = [...formatted.matchAll(/\d/g)];
  const cursor =
    cursorDigits === 0
      ? 0
      : (digitPositions[Math.min(cursorDigits, digitPositions.length) - 1]
          ?.index ?? -1) + 1;
  input.value = formatted;
  input.setSelectionRange(cursor, cursor);
  emit("update:phone", formatted);
}
</script>

<style scoped lang="scss">
.auth-step {
  display: grid;
  gap: var(--expressa-space-button-inline);
}
.auth-step__button {
  width: 100%;
}
</style>
