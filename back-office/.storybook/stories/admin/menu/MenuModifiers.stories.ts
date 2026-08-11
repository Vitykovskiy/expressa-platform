import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import { VCard, VCardText, VDialog } from "vuetify/components";

import type {
  Category,
  CategoryModifierGroupAssignment,
  ModifierGroup,
} from "../../../../src/pages/admin/menu/catalog.types";
import type { ModifierGroupFormData } from "../../../../src/pages/admin/menu/ModifierGroupEditor.types";
import CategoryModifierAssignments from "../../../../src/pages/admin/menu/CategoryModifierAssignments.vue";
import ModifierGroupEditor from "../../../../src/pages/admin/menu/ModifierGroupEditor.vue";
import AdminButton from "../../../../src/shared/ui/admin/admin-button/AdminButton.vue";

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
  args: { onSave: () => undefined, onCancel: () => undefined },
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
};
export const ModifierDefaultsInvalid: GroupStory = {
  args: { onSave: () => undefined, onCancel: () => undefined },
  render: (args) => ({
    components: { ModifierGroupEditor },
    setup: () => ({ args, group }),
    template: `<ModifierGroupEditor :group="group" @save="args.onSave" @cancel="args.onCancel" />`,
  }),
};
export const ModifierLoadingDisabledAndError: GroupStory = {
  args: { onSave: () => undefined, onCancel: () => undefined },
  render: (args) => ({
    components: { ModifierGroupEditor },
    setup: () => ({ args, group }),
    template: `<ModifierGroupEditor :group="group" disabled @save="args.onSave" @cancel="args.onCancel" />`,
  }),
};
export const ModifierLoading: GroupStory = {
  args: { onSave: () => undefined, onCancel: () => undefined },
  render: () => ({
    components: { ModifierGroupEditor },
    setup: () => ({ group }),
    template: `<ModifierGroupEditor :group="group" loading />`,
  }),
};
export const ModifierError: GroupStory = {
  args: { onSave: () => undefined, onCancel: () => undefined },
  render: () => ({
    components: { ModifierGroupEditor },
    setup: () => ({ group }),
    template: `<ModifierGroupEditor :group="group" error-message="Не удалось загрузить группу добавок" />`,
  }),
};
export const CategoryAssignment: AssignmentStory = {
  args: { onSave: () => undefined, onCancel: () => undefined },
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
};
export const CategoryAssignmentLoadingDisabledAndError: AssignmentStory = {
  args: { onSave: () => undefined, onCancel: () => undefined },
  render: () => ({
    components: { CategoryModifierAssignments },
    setup: () => ({ assignments, category, groups: [group] }),
    template: `<CategoryModifierAssignments :category="category" :categories="[category]" :groups="groups" :assignments="assignments" loading />`,
  }),
};
export const CategoryAssignmentError: AssignmentStory = {
  args: { onSave: () => undefined, onCancel: () => undefined },
  render: () => ({
    components: { CategoryModifierAssignments },
    setup: () => ({ assignments, category, groups: [group] }),
    template: `<CategoryModifierAssignments :category="category" :categories="[category]" :groups="groups" :assignments="assignments" error-message="Категория больше не существует" />`,
  }),
};
