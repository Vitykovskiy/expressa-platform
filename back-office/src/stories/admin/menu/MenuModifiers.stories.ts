import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fireEvent, fn, userEvent, within } from "storybook/test";

import type {
  Category,
  CategoryModifierGroupAssignment,
  ModifierGroup,
} from "../../../admin/pages/menu/catalog.types";
import type { ModifierGroupFormData } from "../../../admin/pages/menu/ModifierGroupEditor.types";
import CategoryModifierAssignments from "../../../admin/pages/menu/CategoryModifierAssignments.vue";
import ModifierGroupEditor from "../../../admin/pages/menu/ModifierGroupEditor.vue";

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
    components: { ModifierGroupEditor },
    setup: () => ({ args, group: orderedGroup }),
    template: `<ModifierGroupEditor :group="group" @save="args.onSave" @cancel="args.onCancel" />`,
  }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Переместить Обычное молоко вверх" }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole("button", { name: "Переместить Кокосовое молоко вниз" }),
    ).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Переместить Овсяное молоко вверх" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Сохранить группу" }),
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
    setup: () => ({ args, assignments, category, groups: [group] }),
    template: `<CategoryModifierAssignments :category="category" :categories="[category]" :groups="groups" :assignments="assignments" @save="args.onSave" @cancel="args.onCancel" />`,
  }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("checkbox", { name: "Тип молока" }),
    ).toBeChecked();
    await userEvent.click(
      canvas.getByRole("button", { name: "Сохранить назначения" }),
    );
    await expect(args.onSave).toHaveBeenCalledWith(assignments);
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
