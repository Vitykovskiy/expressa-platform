import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { shallowRef } from "vue";
import { VApp, VCard, VCardText, VCardTitle } from "vuetify/components";

import AdminDialog from "../../../admin/shared/ui/admin-dialog/AdminDialog.vue";
import AdminSelect from "../../../admin/shared/ui/admin-select/AdminSelect.vue";
import AdminTextField from "../../../admin/shared/ui/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../../admin/shared/ui/admin-toggle/AdminToggle.vue";

const meta = {
  title: "Admin/Shared/Admin controls",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Контролируемые Admin primitives. Stories владеют внутренними refs; controls не показывают их. Проверяются public input/change/update:modelValue, disabled и attrs; Dialog также emits afterEnter.",
      },
    },
  },
  argTypes: {
    modelValue: { control: false, table: { disable: true } },
    disabled: { control: "boolean" },
    maxWidth: { control: "text" },
    onInput: { action: "input" },
    onChange: { action: "change" },
    onUpdateModelValue: { action: "update:modelValue" },
    onAfterEnter: { action: "afterEnter" },
  },
} satisfies Meta;

export default meta;

type TextFieldStory = StoryObj<{
  onInput: (event: Event) => void;
  onChange: (event: Event) => void;
  onUpdateModelValue: (value: string) => void;
}>;

type SelectStory = StoryObj<{
  onInput: (event: Event) => void;
  onChange: (event: Event) => void;
  onUpdateModelValue: (value: string) => void;
}>;

type DialogStory = StoryObj<{
  onUpdateModelValue: (value: boolean) => void;
}>;

type ToggleStory = StoryObj<{
  onUpdateModelValue: (value: boolean | null) => void;
}>;

type Story = StoryObj;

function dialogCanvas(canvasElement: HTMLElement) {
  return within(canvasElement.ownerDocument.body);
}

export const TextFieldControlled: TextFieldStory = {
  args: {
    onInput: fn<(event: Event) => void>(),
    onChange: fn<(event: Event) => void>(),
    onUpdateModelValue: fn<(value: string) => void>(),
  },
  render: (args) => ({
    components: { AdminTextField },
    setup() {
      const value = shallowRef("Капучино");

      function updateValue(nextValue: string) {
        value.value = nextValue;
        args.onUpdateModelValue(nextValue);
      }

      return { args, updateValue, value };
    },
    template: `
      <AdminTextField
        v-model="value"
        aria-label="Название товара"
        class="custom-text-field"
        data-testid="admin-text-field"
        style="max-width: 320px"
        @change="args.onChange"
        @input="args.onInput"
        @update:model-value="updateValue"
      />
    `,
  }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox", { name: "Название товара" });

    await expect(field).toHaveClass("custom-text-field");
    await expect(field).toHaveAttribute("data-testid", "admin-text-field");
    await expect(field).toHaveStyle({ maxWidth: "320px" });

    await userEvent.clear(field);
    await userEvent.type(field, "Латте");
    await userEvent.tab();

    await expect(args.onInput).toHaveBeenCalled();
    await expect(args.onChange).toHaveBeenCalled();
    await expect(args.onUpdateModelValue).toHaveBeenLastCalledWith("Латте");
  },
};

export const TextFieldDisabled: Story = {
  render: () => ({
    components: { AdminTextField },
    template:
      '<AdminTextField aria-label="Недоступное поле" disabled model-value="Капучино" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("textbox", { name: "Недоступное поле" }),
    ).toBeDisabled();
  },
};

export const SelectControlled: SelectStory = {
  args: {
    onInput: fn<(event: Event) => void>(),
    onChange: fn<(event: Event) => void>(),
    onUpdateModelValue: fn<(value: string) => void>(),
  },
  render: (args) => ({
    components: { AdminSelect },
    setup() {
      const value = shallowRef("coffee");

      function updateValue(nextValue: string) {
        value.value = nextValue;
        args.onUpdateModelValue(nextValue);
      }

      return { args, updateValue, value };
    },
    template: `
      <AdminSelect
        v-model="value"
        aria-label="Категория"
        class="custom-select"
        data-testid="admin-select"
        style="max-width: 320px"
        @change="args.onChange"
        @input="args.onInput"
        @update:model-value="updateValue"
      >
        <option value="coffee">Кофе</option>
        <option value="tea">Чай</option>
      </AdminSelect>
    `,
  }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole("combobox", { name: "Категория" });

    await expect(select).toHaveClass("custom-select");
    await expect(select).toHaveAttribute("data-testid", "admin-select");
    await expect(select).toHaveStyle({ maxWidth: "320px" });
    await expect(select).toHaveValue("coffee");

    await userEvent.selectOptions(select, "tea");

    await expect(args.onInput).toHaveBeenCalled();
    await expect(args.onChange).toHaveBeenCalled();
    await expect(args.onUpdateModelValue).toHaveBeenLastCalledWith("tea");
  },
};

export const SelectDisabled: Story = {
  render: () => ({
    components: { AdminSelect },
    template: `
      <AdminSelect
        aria-label="Недоступная категория"
        disabled
        model-value="coffee"
      >
        <option value="coffee">Кофе</option>
      </AdminSelect>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("combobox", { name: "Недоступная категория" }),
    ).toBeDisabled();
  },
};

export const ToggleControlled: ToggleStory = {
  args: {
    onUpdateModelValue: fn<(value: boolean | null) => void>(),
  },
  render: (args) => ({
    components: { AdminToggle, VApp },
    setup() {
      const enabled = shallowRef<boolean | null>(false);

      function updateEnabled(value: boolean | null) {
        enabled.value = value;
        args.onUpdateModelValue(value);
      }

      return { args, enabled, updateEnabled };
    },
    template: `
      <v-app>
        <AdminToggle
          v-model="enabled"
          aria-label="Доступность товара"
          class="custom-toggle"
          data-testid="admin-toggle"
          style="max-width: 320px"
          @update:model-value="updateEnabled"
        />
      </v-app>
    `,
  }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("switch", { name: "Доступность товара" });
    const root = canvas.getByTestId("admin-toggle");

    await expect(root).toHaveClass("custom-toggle");
    await expect(root).toHaveStyle({ maxWidth: "320px" });
    await expect(toggle).not.toBeChecked();

    await userEvent.click(toggle);

    await expect(toggle).toBeChecked();
    await expect(args.onUpdateModelValue).toHaveBeenLastCalledWith(true);
  },
};

export const ToggleDisabled: Story = {
  render: () => ({
    components: { AdminToggle, VApp },
    template: `
      <v-app>
        <AdminToggle
          aria-label="Недоступный переключатель"
          disabled
          model-value="false"
        />
      </v-app>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("switch", { name: "Недоступный переключатель" }),
    ).toBeDisabled();
  },
};

export const DialogControlled: DialogStory = {
  args: {
    onUpdateModelValue: fn<(value: boolean) => void>(),
  },
  render: (args) => ({
    components: { AdminDialog, VApp, VCard, VCardText, VCardTitle },
    setup() {
      const open = shallowRef(false);

      function updateOpen(nextValue: boolean) {
        open.value = nextValue;
        args.onUpdateModelValue(nextValue);
      }

      return { args, open, updateOpen };
    },
    template: `
      <v-app>
        <button type="button" @click="open = true">Открыть диалог</button>
        <AdminDialog
          v-model="open"
          class="custom-dialog"
          data-testid="admin-dialog"
          style="max-width: 400px"
          @update:model-value="updateOpen"
        >
          <v-card>
            <v-card-title>Настройки товара</v-card-title>
            <v-card-text>Содержимое диалога передано через slot.</v-card-text>
          </v-card>
        </AdminDialog>
      </v-app>
    `,
  }),
  play: async ({ args, canvasElement }) => {
    const canvas = dialogCanvas(canvasElement);
    const openButton = within(canvasElement).getByRole("button", {
      name: "Открыть диалог",
    });

    await userEvent.click(openButton);

    const dialog = await canvas.findByRole("dialog");
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(dialog).toHaveClass("custom-dialog");
    await expect(dialog).toHaveAttribute("data-testid", "admin-dialog");
    await expect(dialog).toHaveStyle({ maxWidth: "400px" });
    await waitFor(() =>
      expect(
        canvas.getByText("Содержимое диалога передано через slot."),
      ).toBeVisible(),
    );

    await userEvent.keyboard("{Escape}");

    await waitFor(() =>
      expect(args.onUpdateModelValue).toHaveBeenLastCalledWith(false),
    );
  },
};
