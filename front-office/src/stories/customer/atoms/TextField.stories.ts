import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import { VProgressLinear } from "vuetify/components";
import { expect, fn, userEvent, within } from "storybook/test";
import UiTextField from "../../../customer/shared/ui/text-field/UiTextField.vue";

type TextFieldStoryArgs = {
  disabled: boolean;
  modelValue: string;
  "onUpdate:modelValue": (value: string) => void;
};

const meta = {
  title: "Components/Atoms/TextField",
  component: UiTextField,
  args: { disabled: false, modelValue: "", "onUpdate:modelValue": fn() },
  argTypes: {
    modelValue: { control: "text" },
    disabled: { control: "boolean" },
    "onUpdate:modelValue": { action: "update:modelValue" },
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Текстовое поле Customer. Контракт: modelValue, update:modelValue, attrs и slots prepend-inner/loader; attrs передаются корню VTextField, не внутреннему input. Используйте для свободного текста; формат и ошибка принадлежат форме. Accessibility: label создаёт имя textbox, disabled блокирует ввод. Источник: src/customer/shared/ui/text-field/UiTextField.vue.",
      },
    },
  },
  render: (args) => ({
    components: { UiTextField, VProgressLinear },
    setup: () => {
      const model = shallowRef(args.modelValue);
      function updateModelValue(value: string) {
        model.value = value;
        args["onUpdate:modelValue"](value);
      }

      return { args, model, updateModelValue };
    },
    template:
      '<ui-text-field v-model="model" data-testid="text-field" label="Имя" :disabled="args.disabled" hint="Введите имя" persistent-hint @update:model-value="updateModelValue"><template #loader="{ isActive, color }"><v-progress-linear v-if="isActive" :color="color" role="progressbar" /></template></ui-text-field>',
  }),
} satisfies Meta<TextFieldStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector('[data-testid="text-field"]');
    await expect(field).not.toBeNull();
    const input = within(canvasElement).getByRole("textbox", { name: "Имя" });
    await expect(input).not.toHaveAttribute("data-testid");
    await expect(input).toBeVisible();
    await expect(within(canvasElement).getByText("Введите имя")).toBeVisible();
  },
};

export const Model: Story = {
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Имя" });
    await userEvent.type(input, "Анна");
    await expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith("Анна");
  },
};

export const Disabled: Story = {
  args: { disabled: true, modelValue: "Анна" },
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Имя" });
    await expect(input).toBeDisabled();
    await userEvent.type(input, "x");
    await expect(args["onUpdate:modelValue"]).not.toHaveBeenCalled();
  },
};
