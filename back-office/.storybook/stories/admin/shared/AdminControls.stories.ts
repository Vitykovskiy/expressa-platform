import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import { VApp, VCard, VCardText, VCardTitle } from "vuetify/components";

import AdminDialog from "../../../../src/shared/ui/admin/admin-dialog/AdminDialog.vue";
import AdminSelect from "../../../../src/shared/ui/admin/admin-select/AdminSelect.vue";
import AdminTextField from "../../../../src/shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../../../src/shared/ui/admin/admin-toggle/AdminToggle.vue";

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

export const TextFieldControlled: TextFieldStory = {
  args: {
    onInput: () => undefined,
    onChange: () => undefined,
    onUpdateModelValue: () => undefined,
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
};

export const TextFieldDisabled: Story = {
  render: () => ({
    components: { AdminTextField },
    template:
      '<AdminTextField aria-label="Недоступное поле" disabled model-value="Капучино" />',
  }),
};

export const SelectControlled: SelectStory = {
  args: {
    onInput: () => undefined,
    onChange: () => undefined,
    onUpdateModelValue: () => undefined,
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
};

export const ToggleControlled: ToggleStory = {
  args: {
    onUpdateModelValue: () => undefined,
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
};

export const DialogControlled: DialogStory = {
  args: {
    onUpdateModelValue: () => undefined,
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
};
