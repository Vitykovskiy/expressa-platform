import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import UiToggle from "@/shared/ui/customer/toggle/UiToggle.vue";

type UiToggleStoryArgs = {
  disabled: boolean;
  modelValue: boolean;
  "onUpdate:modelValue": (value: boolean | null) => void;
};

const meta = {
  title: "Components/Atoms/UiToggle",
  component: UiToggle,
  args: {
    disabled: false,
    modelValue: false,
    "onUpdate:modelValue": () => undefined,
  },
  argTypes: {
    modelValue: { control: "boolean" },
    disabled: { control: "boolean" },
    "onUpdate:modelValue": { action: "update:modelValue" },
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Переключатель boolean-состояния. Контракт: modelValue, disabled, update:modelValue и label slot. Используйте только для немедленно применяемой настройки; подтверждение остаётся у родителя. Accessibility: switch имеет имя и disabled. Источник: src/shared/ui/customer/toggle/UiToggle.vue.",
      },
    },
  },
  render: (args) => ({
    components: { UiToggle },
    setup: () => {
      const model = shallowRef(args.modelValue);
      function updateModelValue(value: boolean | null) {
        model.value = value ?? false;
        args["onUpdate:modelValue"](value);
      }

      return { args, model, updateModelValue };
    },
    template:
      '<ui-toggle v-model="model" data-testid="toggle" label="Получать уведомления" :disabled="args.disabled" @update:model-value="updateModelValue"><template #label>Получать уведомления</template></ui-toggle>',
  }),
} satisfies Meta<UiToggleStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Model: Story = {};

export const Disabled: Story = {
  args: { disabled: true, modelValue: true },
};
