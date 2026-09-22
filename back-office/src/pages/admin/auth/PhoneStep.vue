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
        ref="phoneInput"
        v-model="phoneModel"
        :aria-describedby="field.describedBy"
        :aria-invalid="field.invalid"
        :aria-required="field.required"
        autocomplete="tel"
        autofocus
        inputmode="tel"
        name="phone"
        :required="field.required"
        type="tel"
        @keydown.enter.prevent="emit('submit')"
      >
        <template #prepend><AdminIcon :icon="Phone" /></template>
      </AdminTextField>
    </AdminFieldWrapper>
    <AdminButton class="auth-step__button" :disabled="!valid" type="submit">
      Отправить код
    </AdminButton>
  </form>
</template>

<script setup lang="ts">
import { Phone } from "lucide-vue-next";
import { computed, onMounted, useTemplateRef } from "vue";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminIcon from "../../../shared/ui/admin/admin-icon/AdminIcon.vue";
import AdminFieldWrapper from "../../../shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";

import type { PhoneStepEmits, PhoneStepProps } from "./PhoneStep.types";

const props = defineProps<PhoneStepProps>();

const emit = defineEmits<PhoneStepEmits>();

const phoneModel = computed({
  get: () => props.phone,
  set: (value: string) => emit("update:phone", value),
});

const phoneInput =
  useTemplateRef<InstanceType<typeof AdminTextField>>("phoneInput");

onMounted(() => phoneInput.value?.focus());
</script>

<style scoped lang="scss">
.auth-step {
  display: grid;
  gap: var(--expressa-space-button-inline);
}
.auth-step__button {
  display: flex;
  width: 100%;
  padding: var(--expressa-space-control-block) 0;
  align-items: center;
  justify-content: center;
  gap: var(--expressa-space-sm);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: var(--expressa-line-height-control);
}
</style>
