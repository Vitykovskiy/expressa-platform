import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { VApp } from "vuetify/components";

import type {
  AvailabilityChangeEvent,
  MenuItem,
} from "../../../../src/shared/ui/admin/Admin.types";
import AvailabilityScreen from "../../../../src/pages/admin/availability/AvailabilityScreen.vue";

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
    components: { AvailabilityScreen, VApp },
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
    "onAvailability-change": () => undefined,
  },
  render: (args) => screenRender(args),
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
    "onAvailability-change": () => undefined,
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
    "onAvailability-change": () => undefined,
  },
  render: (args) => screenRender(args),
};

export const Empty: Story = {
  args: {
    menuItems: [],
    "onAvailability-change": () => undefined,
  },
  render: (args) => screenRender(args),
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
    "onAvailability-change": () => undefined,
  },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  render: (args) => screenRender(args),
};
