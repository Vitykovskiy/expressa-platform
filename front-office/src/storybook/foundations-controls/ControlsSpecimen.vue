<template>
  <StoryCanvas :width="mode === 'quantity' ? '20rem' : undefined">
    <template v-if="mode === 'states'">
      <h1>Controls</h1>
      <section>
        <h2>Кнопки</h2>
        <UiButton /><UiButton variant="secondary" /><UiButton
          loading
        /><UiButton disabled /><UiIconButton label="Закрыть" /><UiIconButton
          label="Загрузка"
          loading
        /><UiIconButton label="Недоступно" disabled />
      </section>
      <section>
        <h2>Поля</h2>
        <TextField v-model="name" label="Имя" placeholder="Анна" /><TextField
          label="Имя"
          error="Укажите имя"
        /><TextField label="Имя" loading /><TextField
          label="Имя"
          disabled
        /><TextField
          label="Очень длинная подпись поля, которая не должна выходить за пределы узкого экрана"
          placeholder="Очень длинное значение для проверки переноса текста"
        /><PhoneField v-model="phone" /><PhoneField
          error="Введите номер полностью"
        /><PhoneField loading /><PhoneField disabled /><OtpInput
          v-model="otp"
        /><OtpInput error="Код неполный или неверный" /><OtpInput
          loading
        /><OtpInput disabled />
      </section>
      <section>
        <h2>Выбор</h2>
        <UiCheckbox v-model="terms" label="Согласен с условиями" /><UiCheckbox
          label="Согласен с условиями"
          error="Нужно подтверждение"
        /><UiCheckbox label="Согласен с условиями" loading /><UiCheckbox
          label="Согласен с условиями"
          disabled
        /><UiRadio v-model="radio" value="delivery" label="Доставка" /><UiRadio
          v-model="radio"
          value="pickup"
          label="Самовывоз"
          error="Выберите вариант"
        /><UiRadio value="pickup" label="Самовывоз" loading /><UiRadio
          value="pickup"
          label="Самовывоз"
          disabled
        /><UiChip v-model="chip" label="Без сахара" /><UiChip
          label="Без сахара"
          loading
        /><UiChip label="Без сахара" disabled />
      </section>
    </template>
    <template v-else-if="mode === 'quantity'">
      <QuantityStepper v-model="quantity" :min="1" :max="3" /><QuantityStepper
        :model-value="1"
        :min="1"
        :max="3"
        disabled
      />
      <p>Итого: {{ quantity * 12499 }} ₽</p>
    </template>
    <template v-else>
      <UiButton /><UiIconButton label="Закрыть" /><TextField
        v-model="name"
        label="Имя"
      /><PhoneField v-model="phone" /><OtpInput v-model="otp" /><UiCheckbox
        v-model="terms"
        label="Согласен с условиями"
      /><UiRadio v-model="radio" value="delivery" label="Доставка" /><UiChip
        v-model="chip"
        label="Без сахара"
      /><QuantityStepper v-model="quantity" />
    </template>
  </StoryCanvas>
</template>

<script setup lang="ts">
import { ref } from "vue";

import OtpInput from "../../shared/ui/OtpInput.vue";
import PhoneField from "../../shared/ui/PhoneField.vue";
import QuantityStepper from "../../shared/ui/QuantityStepper.vue";
import TextField from "../../shared/ui/TextField.vue";
import UiButton from "../../shared/ui/UiButton.vue";
import UiCheckbox from "../../shared/ui/UiCheckbox.vue";
import UiChip from "../../shared/ui/UiChip.vue";
import UiIconButton from "../../shared/ui/UiIconButton.vue";
import UiRadio from "../../shared/ui/UiRadio.vue";
import StoryCanvas from "./StoryCanvas.vue";

withDefaults(defineProps<{ mode?: "focus" | "quantity" | "states" }>(), {
  mode: "states",
});
const chip = ref(false);
const name = ref("");
const otp = ref("");
const phone = ref("");
const quantity = ref(1);
const radio = ref("delivery");
const terms = ref(false);
</script>

<style scoped>
section {
  display: grid;
  gap: var(--fo-space-3);
}
h1,
h2,
p {
  margin: 0;
}
</style>
