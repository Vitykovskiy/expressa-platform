import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import SlotOption from "../../../customer/pages/checkout/SlotOption.vue";
import type { TimeSlot } from "../../../customer/shared/model/customer.types";

type SlotOptionStoryArgs = {
  timeSlot: TimeSlot;
  selected: boolean;
  disabled: boolean;
  onSelect: (slotId: string) => void;
};

const slot: TimeSlot = {
  id: "slot-10-00",
  timeFrom: "10:00",
  timeTo: "10:30",
  date: "Сегодня, 9 марта",
  available: 3,
  capacity: 6,
};

const meta = {
  title: "Components/Patterns/SlotOption",
  component: SlotOption,
  args: {
    timeSlot: slot,
    selected: false,
    disabled: false,
    onSelect: fn(),
  },
  argTypes: {
    timeSlot: { control: "object" },
    selected: { control: "boolean" },
    disabled: { control: "boolean" },
    onSelect: { action: "select" },
  },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Выбор временного слота. Контракт: timeSlot, selected, disabled и select(slotId); экран подтверждает заказ. Full или disabled не отправляет select; длинная дата переносится. Accessibility: именованная button и aria-pressed. Источник: src/customer/pages/checkout/SlotOption.vue.",
      },
    },
  },
  render: (args) => ({
    components: { SlotOption },
    setup: () => ({ args }),
    template:
      '<SlotOption :time-slot="args.timeSlot" :selected="args.selected" :disabled="args.disabled" @select="args.onSelect" />',
  }),
} satisfies Meta<SlotOptionStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

const slotName = /10:00.*10:30.*Сегодня, 9 марта.*3\/6/;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: slotName }),
    );
    await expect(args.onSelect).toHaveBeenCalledWith("slot-10-00");
  },
};

export const Selected: Story = {
  args: { selected: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", { name: /Выбрано/ }),
    ).toHaveAttribute("aria-pressed", "true");
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole("button", {
      name: slotName,
    });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onSelect).not.toHaveBeenCalled();
  },
};

export const Full: Story = {
  args: { timeSlot: { ...slot, available: 0 } },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", { name: /Занято/ }),
    ).toBeDisabled();
  },
};

export const Long: Story = {
  args: {
    timeSlot: {
      ...slot,
      date: "Сегодня, понедельник, 9 марта, выдача у главного входа в кофейню",
    },
  },
};
