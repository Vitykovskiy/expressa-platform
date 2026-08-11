import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import { VBtn, VCard, VCardText, VCardTitle } from "vuetify/components";
import UiDialog from "@/shared/ui/customer/dialog/UiDialog.vue";

type UiDialogStoryArgs = {
  modelValue: boolean;
  "onUpdate:modelValue": (value: boolean) => void;
};

const meta = {
  title: "Components/Atoms/UiDialog",
  component: UiDialog,
  args: { modelValue: true, "onUpdate:modelValue": () => undefined },
  argTypes: {
    modelValue: { control: "boolean" },
    "onUpdate:modelValue": { action: "update:modelValue" },
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Диалог с v-model. Контракт: modelValue, update:modelValue и default slot; владелец решает открытие, валидацию и фокус. Используйте для модального подтверждения, не для inline-сообщения. Источник: src/shared/ui/customer/dialog/UiDialog.vue.",
      },
    },
  },
  render: (args) => ({
    components: { UiDialog, VBtn, VCard, VCardText, VCardTitle },
    setup: () => {
      const model = shallowRef(args.modelValue);
      function updateModelValue(value: boolean) {
        model.value = value;
        args["onUpdate:modelValue"](value);
      }

      return { args, model, updateModelValue };
    },
    template:
      '<div><v-btn @click="model = true">Открыть</v-btn><ui-dialog v-model="model" data-testid="dialog" @update:model-value="updateModelValue"><v-card><v-card-title>Заголовок</v-card-title><v-card-text>Содержимое диалога</v-card-text><v-btn @click="model = false">Закрыть</v-btn></v-card></ui-dialog></div>',
  }),
} satisfies Meta<UiDialogStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Model: Story = {
  args: { modelValue: false },
};
