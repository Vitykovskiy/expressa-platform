import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { createCustomerDefaults } from "./fixtures/customer.fixtures";
import SlotPickerScreen from "../../customer/pages/checkout/SlotPickerScreen.vue";

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
    onSelectSlot: fn(),
    onConfirm: fn(),
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
          "Назначение: экран выбора delivery slot. Используйте для select и confirm; не используйте без slots. Props: slots, selectedSlotId, loading, errorMessage; actions: selectSlot, confirm; slots отсутствуют. Состояния: unselected, selected, full, loading, error. Full/loading подавляют handlers. Accessibility: slot controls имеют имена, error доступна; layout responsive. Источник: src/customer/pages/checkout/SlotPickerScreen.vue, src/stories/customer/SlotPicker.stories.ts.",
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
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const slot = canvas.getByRole("button", { name: /10:45–11:00/ });
    await userEvent.click(slot);
    await expect(args.onSelectSlot).toHaveBeenCalledTimes(1);
    await expect(args.onSelectSlot).toHaveBeenCalledWith("s4");
    await userEvent.click(
      canvas.getByRole("button", { name: "Подтвердить заказ" }),
    );
    await expect(args.onConfirm).toHaveBeenCalledWith("s4");
  },
};
export const FullDisabled: Story = {
  args: { slots: fullSlots, selectedSlotId: null },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const slot = canvas.getByRole("button", { name: /10:45–11:00/ });
    await expect(slot).toBeDisabled();
    const confirm = canvas.getByRole("button", { name: "Подтвердить заказ" });
    await expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "Пожалуйста, выберите временной слот.",
    );
    await expect(args.onSelectSlot).not.toHaveBeenCalled();
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};
export const Loading: Story = {
  args: { selectedSlotId: slots[0]!.id, loading: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole("status");
    const confirm = canvas.getByRole("button", { name: "Подтверждаем..." });
    const selectedSlot = canvas.getByRole("button", { name: /10:00–10:15/ });

    await expect(status).toHaveTextContent("Создаём заказ...");
    await expect(canvas.getByText("Подтверждаем...")).toBeVisible();
    await expect(confirm).toBeDisabled();
    await expect(selectedSlot).toHaveAttribute("aria-pressed", "true");
    await expect(selectedSlot).toBeDisabled();
    await expect(
      canvas.getByRole("button", { name: /10:45–11:00/ }),
    ).toBeDisabled();
  },
};

export const LoadingVisual: Story = {
  args: Loading.args,
};

export const Error: Story = {
  args: { errorMessage: "Не удалось создать заказ. Попробуйте ещё раз." },
};
