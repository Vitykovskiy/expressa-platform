import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { ref } from "vue";

import type {
  AvailabilityChangeEvent,
  MenuItem,
} from "../../../admin/shared/ui/Admin.types";
import AvailabilityScreen from "../../../admin/pages/availability/AvailabilityScreen.vue";

const meta = {
  title: "Admin/Availability/AvailabilityScreen",
  component: AvailabilityScreen,
  argTypes: {
    menuItems: {
      control: "object",
      description: "Позиции меню, сгруппированные экраном по категории.",
    },
    "onAvailability-change": {
      action: "availability-change",
      description: "Сообщает идентификатор и новое состояние доступности.",
    },
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AvailabilityScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function screenRender(args: {
  menuItems: readonly MenuItem[];
  "onAvailability-change"?: (event: AvailabilityChangeEvent) => void;
}) {
  return {
    components: { AvailabilityScreen },
    setup() {
      const menuItems = ref(args.menuItems.map((item) => ({ ...item })));

      function changeAvailability(event: AvailabilityChangeEvent) {
        menuItems.value = menuItems.value.map((item) =>
          item.id === event.id ? { ...item, available: event.checked } : item,
        );
        args["onAvailability-change"]?.(event);
      }

      return { changeAvailability, menuItems };
    },
    template: `
      <v-app>
        <AvailabilityScreen
          :menu-items="menuItems"
          @availability-change="changeAvailability"
        />
      </v-app>
    `,
  };
}

export const Default: Story = {
  args: {
    menuItems: [
      {
        id: "1",
        name: "Капучино",
        category: "Кофе",
        available: true,
        price: 220,
      },
    ],
    "onAvailability-change": fn<(event: AvailabilityChangeEvent) => void>(),
  },
  render: (args) => screenRender(args),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const switchControl = canvas.getByRole("switch", { name: "Капучино" });

    await expect(
      canvas.getByRole("heading", { name: "Доступность", level: 1 }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("heading", { name: "Кофе", level: 2 }),
    ).toBeVisible();
    await expect(switchControl).toBeChecked();

    await userEvent.click(switchControl);

    await expect(switchControl).not.toBeChecked();
    const onAvailabilityChange = args["onAvailability-change"];
    if (!onAvailabilityChange)
      throw new Error("Availability change handler is not configured");

    await expect(onAvailabilityChange).toHaveBeenCalledWith({
      id: "1",
      checked: false,
    });
    await waitFor(() => {
      const statuses = body.getAllByRole("status");

      expect(statuses).toHaveLength(1);
      expect(statuses[0]).toHaveTextContent("Сохранено");
      expect(statuses[0]).toBeVisible();
    });
  },
};

export const DefaultVisual: Story = {
  args: {
    menuItems: [
      {
        id: "visual",
        name: "Капучино",
        category: "Кофе",
        available: true,
        price: 220,
      },
    ],
    "onAvailability-change": fn<(event: AvailabilityChangeEvent) => void>(),
  },
  render: (args) => screenRender(args),
};

export const CategoryFilter: Story = {
  args: {
    menuItems: [
      {
        id: "2",
        name: "Круассан",
        category: "Выпечка",
        available: true,
        price: 120,
      },
    ],
    "onAvailability-change": fn<(event: AvailabilityChangeEvent) => void>(),
  },
  render: (args) => screenRender(args),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "Выпечка" }));

    await expect(
      canvas.getByRole("heading", { name: "Выпечка", level: 2 }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("heading", { name: "Кофе", level: 2 }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("switch", { name: "Круассан" }),
    ).toBeChecked();
  },
};

export const Empty: Story = {
  args: {
    menuItems: [],
    "onAvailability-change": fn<(event: AvailabilityChangeEvent) => void>(),
  },
  render: (args) => screenRender(args),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("status")).toHaveTextContent("Меню пусто");
    await expect(
      canvas.getByText("Позиции появятся после добавления в меню"),
    ).toBeVisible();
  },
};

export const LongNarrow: Story = {
  args: {
    menuItems: [
      {
        id: "long",
        name: "Очень длинное название позиции для проверки переноса текста на узком экране",
        category: "Очень длинное название категории доступности",
        available: true,
        price: 220,
      },
    ],
    "onAvailability-change": fn<(event: AvailabilityChangeEvent) => void>(),
  },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  render: (args) => screenRender(args),
  play: async ({ canvasElement }) => {
    const screen = canvasElement.querySelector(".availability-screen");

    if (!screen) throw new Error("Availability screen is not rendered");

    await expect(screen.scrollWidth).toBeLessThanOrEqual(screen.clientWidth);
  },
};
