import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createCustomerDefaults } from "./fixtures/customer.fixtures";
import SlotPickerScreen from "@/features/checkout/SlotPickerScreen.vue";

const slots = createCustomerDefaults().slots;
const fullSlots = slots.map((slot) => ({ ...slot, available: 0 }));

const meta = {
  title: "Customer/Screens/SlotPicker",
  component: SlotPickerScreen,
  args: {
    slots,
    selectedSlotId: null,
    loading: false,
    errorMessage: "",
    onSelectSlot: () => undefined,
    onConfirm: () => undefined,
  },
  argTypes: {
    slots: { control: "object", description: "Доступные доменные слоты." },
    selectedSlotId: { control: "text", description: "Выбранный id или null." },
    loading: {
      control: "boolean",
      description: "Подавляет действия во время подтверждения.",
    },
    errorMessage: {
      control: "text",
      description: "Текст ошибки подтверждения.",
    },
    onSelectSlot: { action: "selectSlot" },
    onConfirm: { action: "confirm" },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Назначение: экран выбора delivery slot. Используйте для select и confirm; не используйте без slots. Props: slots, selectedSlotId, loading, errorMessage; actions: selectSlot, confirm; slots отсутствуют. Состояния: unselected, selected, full, loading, error. Full/loading подавляют handlers. Accessibility: slot controls имеют имена, error доступна; layout responsive. Источник: src/features/checkout/SlotPickerScreen.vue, .storybook/stories/customer/SlotPicker.stories.ts.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SlotPickerScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {};
export const Selected: Story = {
  args: { selectedSlotId: "s4" },
};
export const FullDisabled: Story = {
  args: { slots: fullSlots, selectedSlotId: null },
};
export const Loading: Story = {
  args: { selectedSlotId: slots[0]!.id, loading: true },
};

export const LoadingVisual: Story = {
  args: Loading.args,
};

export const Error: Story = {
  args: { errorMessage: "Не удалось создать заказ. Попробуйте ещё раз." },
};
