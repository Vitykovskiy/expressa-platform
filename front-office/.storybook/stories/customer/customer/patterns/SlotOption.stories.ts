import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SlotOption from "@/features/checkout/SlotOption.vue";
import type { TimeSlot } from "@/entities/customer/model/customer.types";

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
    onSelect: () => undefined,
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
          "Выбор временного слота. Контракт: timeSlot, selected, disabled и select(slotId); экран подтверждает заказ. Full или disabled не отправляет select; длинная дата переносится. Accessibility: именованная button и aria-pressed. Источник: src/features/checkout/SlotOption.vue.",
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

export const Default: Story = {};

export const Selected: Story = {
  args: { selected: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Full: Story = {
  args: { timeSlot: { ...slot, available: 0 } },
};

export const Long: Story = {
  args: {
    timeSlot: {
      ...slot,
      date: "Сегодня, понедельник, 9 марта, выдача у главного входа в кофейню",
    },
  },
};
