import type { Meta, StoryObj } from "@storybook/vue3-vite";
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";
import { shallowRef } from "vue";
import { VCard, VCardText, VDialog } from "vuetify/components";

import type {
  Category,
  CategoryModifierGroupAssignment,
  ModifierGroup,
} from "../../../admin/pages/menu/catalog.types";
import type { ModifierGroupFormData } from "../../../admin/pages/menu/ModifierGroupEditor.types";
import CategoryModifierAssignments from "../../../admin/pages/menu/CategoryModifierAssignments.vue";
import ModifierGroupEditor from "../../../admin/pages/menu/ModifierGroupEditor.vue";
import AdminButton from "../../../admin/shared/ui/admin-button/AdminButton.vue";

const category: Category = {
  id: "coffee",
  name: "Кофе",
  description: "Горячие напитки",
  sortOrder: 0,
  isActive: true,
};
const group: ModifierGroup = {
  id: "milk",
  name: "Тип молока",
  selectionType: "single",
  minSelect: 1,
  maxSelect: 1,
  isActive: true,
  options: [
    {
      id: "regular",
      groupId: "milk",
      name: "Обычное молоко",
      priceDeltaMinor: 0,
      sortOrder: 0,
      isDefault: true,
      isAvailable: true,
    },
  ],
};
const longNameGroup: ModifierGroup = {
  ...group,
  id: "seasonal-syrups",
  name: "Сезонные сиропы для горячих и холодных напитков",
};
const assignments: readonly CategoryModifierGroupAssignment[] = [
  { categoryId: "coffee", modifierGroupId: "milk", sortOrder: 0 },
];
const orderedGroup: ModifierGroup = {
  ...group,
  minSelect: 0,
  options: [
    {
      ...group.options[0],
      id: "regular",
      name: "Обычное молоко",
      isDefault: false,
    },
    {
      ...group.options[0],
      id: "oat",
      name: "Овсяное молоко",
      sortOrder: 1,
      isDefault: false,
    },
    {
      ...group.options[0],
      id: "coconut",
      name: "Кокосовое молоко",
      sortOrder: 2,
      isDefault: false,
    },
  ],
};
const meta = {
  title: "Admin/Menu/Modifiers",
  parameters: { layout: "centered" },
} satisfies Meta;
export default meta;
type GroupStory = StoryObj<{
  onSave: (data: ModifierGroupFormData) => void;
  onCancel: () => void;
}>;
type AssignmentStory = StoryObj<{
  onSave: (data: readonly CategoryModifierGroupAssignment[]) => void;
  onCancel: () => void;
}>;
export const ModifierDefaults: GroupStory = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => ({
    components: {
      AdminButton,
      ModifierGroupEditor,
      VCard,
      VCardText,
      VDialog,
    },
    setup: () => {
      const open = shallowRef(false);

      function close() {
        open.value = false;
        args.onCancel();
      }

      function save(data: ModifierGroupFormData) {
        args.onSave(data);
        open.value = false;
      }

      return { close, group: orderedGroup, open, save };
    },
    template: `
      <AdminButton type="button" @click="open = true">Открыть группу добавок</AdminButton>
      <v-dialog v-model="open" max-width="800">
        <v-card class="modifier-dialog-story">
          <v-card-text class="modifier-dialog-story__content">
            <ModifierGroupEditor :group="group" @save="save" @cancel="close" />
          </v-card-text>
        </v-card>
      </v-dialog>
    `,
  }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const document = canvasElement.ownerDocument;
    const body = within(document.body);
    const opener = canvas.getByRole("button", {
      name: "Открыть группу добавок",
    });
    const waitForOpenDialog = async () => {
      await waitFor(() => {
        const overlay = document.querySelector(".v-overlay--active");
        expect(overlay).not.toBeNull();
        expect(getComputedStyle(overlay!).opacity).toBe("1");
        expect(
          body.getByRole("button", { name: "Сохранить группу" }),
        ).toBeVisible();
      });
    };
    const waitForClosedDialog = async () => {
      await waitFor(() => {
        expect(document.querySelector(".v-overlay--active")).toBeNull();
        expect(body.queryByRole("dialog")).not.toBeInTheDocument();
      });
      await waitFor(() => expect(opener).toHaveFocus());
    };

    opener.focus();
    await userEvent.click(opener);
    await waitForOpenDialog();
    let dialog = within(body.getByRole("dialog"));
    await fireEvent.click(dialog.getByRole("button", { name: "Отмена" }));
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
    await waitForClosedDialog();

    await userEvent.click(opener);
    await waitForOpenDialog();
    dialog = within(body.getByRole("dialog"));
    await expect(
      dialog.getByRole("button", {
        name: "Переместить Обычное молоко вверх",
      }),
    ).toBeDisabled();
    await expect(
      dialog.getByRole("button", {
        name: "Переместить Кокосовое молоко вниз",
      }),
    ).toBeDisabled();
    await fireEvent.click(
      dialog.getByRole("button", {
        name: "Переместить Овсяное молоко вверх",
      }),
    );
    await fireEvent.click(
      dialog.getByRole("button", { name: "Сохранить группу" }),
    );
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [
          expect.objectContaining({ name: "Овсяное молоко", sortOrder: 0 }),
          expect.objectContaining({ name: "Обычное молоко", sortOrder: 1 }),
          expect.objectContaining({ name: "Кокосовое молоко", sortOrder: 2 }),
        ],
      }),
    );
    await waitForClosedDialog();

    await userEvent.click(opener);
    await waitForOpenDialog();
    const openerRect = opener.getBoundingClientRect();
    const hitTarget = document.elementFromPoint(
      openerRect.left + openerRect.width / 2,
      openerRect.top + openerRect.height / 2,
    );
    expect(opener.contains(hitTarget)).toBe(false);
  },
};
export const ModifierDefaultsInvalid: GroupStory = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => ({
    components: { ModifierGroupEditor },
    setup: () => ({ args, group }),
    template: `<ModifierGroupEditor :group="group" @save="args.onSave" @cancel="args.onCancel" />`,
  }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const option = canvas.getByRole("group", { name: "Вариант добавки" });
    const optionCanvas = within(option);
    const name = optionCanvas.getByRole("textbox", { name: "Название" });
    const price = optionCanvas.getByRole("spinbutton", {
      name: "Изменение цены, коп.",
    });

    await fireEvent.input(name, { target: { value: "" } });
    await fireEvent.input(price, { target: { value: "abc" } });
    await expect(
      optionCanvas.getByText("Введите название варианта"),
    ).toBeVisible();
    await expect(
      optionCanvas.getByText("Укажите целое изменение цены в копейках"),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Сохранить группу" }),
    ).toBeDisabled();

    await fireEvent.input(name, { target: { value: "Овсяное молоко" } });
    await fireEvent.input(price, { target: { value: "0" } });
    await expect(
      canvas.getByRole("button", { name: "Сохранить группу" }),
    ).toBeEnabled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Сохранить группу" }),
    );
    await expect(args.onSave).toHaveBeenCalledWith({
      id: "milk",
      name: "Тип молока",
      selectionType: "single",
      minSelect: 1,
      maxSelect: 1,
      isActive: true,
      options: [
        {
          id: "regular",
          name: "Овсяное молоко",
          priceDeltaMinor: 0,
          sortOrder: 0,
          isDefault: true,
          isAvailable: true,
        },
      ],
    });
  },
};
export const ModifierLoadingDisabledAndError: GroupStory = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => ({
    components: { ModifierGroupEditor },
    setup: () => ({ args, group }),
    template: `<ModifierGroupEditor :group="group" disabled @save="args.onSave" @cancel="args.onCancel" />`,
  }),
};
export const ModifierLoading: GroupStory = {
  args: { onSave: fn(), onCancel: fn() },
  render: () => ({
    components: { ModifierGroupEditor },
    setup: () => ({ group }),
    template: `<ModifierGroupEditor :group="group" loading />`,
  }),
};
export const ModifierError: GroupStory = {
  args: { onSave: fn(), onCancel: fn() },
  render: () => ({
    components: { ModifierGroupEditor },
    setup: () => ({ group }),
    template: `<ModifierGroupEditor :group="group" error-message="Не удалось загрузить группу добавок" />`,
  }),
};
export const CategoryAssignment: AssignmentStory = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => ({
    components: { CategoryModifierAssignments },
    setup: () => ({
      args,
      assignments: [
        {
          categoryId: category.id,
          modifierGroupId: longNameGroup.id,
          sortOrder: 0,
        },
      ],
      category,
      groups: [longNameGroup],
    }),
    template: `<CategoryModifierAssignments :category="category" :categories="[category]" :groups="groups" :assignments="assignments" @save="args.onSave" @cancel="args.onCancel" />`,
  }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const assignmentsRoot = canvas.getByRole("region", {
      name: "Группы добавок категории",
    });
    const expectedAssignments = [
      {
        categoryId: category.id,
        modifierGroupId: longNameGroup.id,
        sortOrder: 0,
      },
    ];

    await expect(
      canvas.getByRole("checkbox", { name: longNameGroup.name }),
    ).toBeChecked();
    await expect(assignmentsRoot.scrollWidth).toBeLessThanOrEqual(
      assignmentsRoot.clientWidth,
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Сохранить назначения" }),
    );
    await expect(args.onSave).toHaveBeenCalledWith(expectedAssignments);
  },
};
export const CategoryAssignmentLoadingDisabledAndError: AssignmentStory = {
  args: { onSave: fn(), onCancel: fn() },
  render: () => ({
    components: { CategoryModifierAssignments },
    setup: () => ({ assignments, category, groups: [group] }),
    template: `<CategoryModifierAssignments :category="category" :categories="[category]" :groups="groups" :assignments="assignments" loading />`,
  }),
};
export const CategoryAssignmentError: AssignmentStory = {
  args: { onSave: fn(), onCancel: fn() },
  render: () => ({
    components: { CategoryModifierAssignments },
    setup: () => ({ assignments, category, groups: [group] }),
    template: `<CategoryModifierAssignments :category="category" :categories="[category]" :groups="groups" :assignments="assignments" error-message="Категория больше не существует" />`,
  }),
};
