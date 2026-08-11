import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import { createCustomerDefaults } from "./fixtures/customer.fixtures";
import OrdersHistoryScreen from "@/features/orders/OrdersHistoryScreen.vue";
import type {
  Order,
  OrderStatus,
} from "@/entities/customer/model/customer.types";

type OrdersHistoryStoryArgs = {
  orders: Order[];
  statusLabels: Record<OrderStatus, string>;
  refreshing: boolean;
  expandedOrderIds: string[];
  onRefresh: () => void;
  onToggleOrder: (orderId: string, expanded: boolean) => void;
};

const fixtures = createCustomerDefaults();
const [firstOrder] = fixtures.orders;
const statusOrderIds: Record<OrderStatus, string> = {
  pending: "1051",
  preparing: "1050",
  ready: "1049",
  completed: "1048",
  cancelled: "1047",
};

function withStatus(status: OrderStatus): Order {
  return { ...firstOrder, id: statusOrderIds[status], status };
}

const meta = {
  title: "Customer/Screens/OrdersHistory",
  component: OrdersHistoryScreen,
  args: {
    orders: fixtures.orders,
    statusLabels: fixtures.statusLabels,
    refreshing: false,
    expandedOrderIds: [],
    onRefresh: () => undefined,
    onToggleOrder: () => undefined,
  },
  argTypes: {
    orders: {
      control: "object",
      description: "Список Order для истории; порядок задаёт экран.",
    },
    statusLabels: {
      control: "object",
      description: "Подписи всех пяти OrderStatus.",
    },
    refreshing: {
      control: "boolean",
      description: "Включает aria-busy и loading состояние refresh action.",
    },
    expandedOrderIds: {
      control: "object",
      description: "Открытые заказы: родительское состояние экрана.",
    },
    onRefresh: {
      control: false,
      description: "Получает refresh без параметров.",
    },
    onToggleOrder: {
      control: false,
      description: "Получает orderId и следующее expanded состояние.",
    },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Экран истории заказов. Args: orders, statusLabels, refreshing, expandedOrderIds; callbacks: onRefresh(), onToggleOrder(orderId, expanded); slots отсутствуют. expandedOrderIds применяются только при инициализации экземпляра: дальнейшее состояние disclosure хранит экран. Состояния: collapsed/populated, expanded, empty, refreshing, пять независимых статусов и long. Действия: refresh и раскрытие/сворачивание заказа; валидация и загрузка данных принадлежат родителю. Accessibility: section сообщает aria-busy, refresh имеет доступное имя, disclosure синхронизирует aria-expanded, aria-controls и details DOM; native buttons поддерживают Tab, Enter и Space. На mobile список одноколоночный, на широком экране layout экрана становится grid. Empty/error границы: пустой массив показывает status, ошибка данных должна быть обработана родителем. Источник: src/features/orders/OrdersHistoryScreen.vue и src/entities/customer/model/customer.types.ts.",
      },
    },
  },
  tags: ["autodocs"],
  render: (args) => ({
    components: { OrdersHistoryScreen },
    setup: () => {
      const expandedOrderIds = shallowRef(args.expandedOrderIds);
      function toggleOrder(orderId: string, expanded: boolean) {
        expandedOrderIds.value = expanded
          ? [...expandedOrderIds.value, orderId]
          : expandedOrderIds.value.filter((id) => id !== orderId);
        args.onToggleOrder(orderId, expanded);
      }
      return { args, expandedOrderIds, toggleOrder };
    },
    template:
      '<OrdersHistoryScreen :orders="args.orders" :status-labels="args.statusLabels" :refreshing="args.refreshing" :expanded-order-ids="expandedOrderIds" @refresh="args.onRefresh" @toggle-order="toggleOrder" />',
  }),
} satisfies Meta<OrdersHistoryStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};
export const Empty: Story = { args: { orders: [] } };
export const Expanded: Story = { args: { expandedOrderIds: ["1042"] } };
export const Refreshing: Story = {
  args: { refreshing: true },
};
export const Pending: Story = { args: { orders: [withStatus("pending")] } };
export const Preparing: Story = { args: { orders: [withStatus("preparing")] } };
export const Ready: Story = { args: { orders: [withStatus("ready")] } };
export const Completed: Story = { args: { orders: [withStatus("completed")] } };
export const Cancelled: Story = { args: { orders: [withStatus("cancelled")] } };
export const Long: Story = {
  args: {
    orders: [
      {
        ...firstOrder,
        id: "1046",
        createdAt: "9 марта 2026, 10:32",
        items: [
          {
            productName: "Капучино с очень длинным названием сезонного напитка",
            quantity: 2,
            lineTotalRub: 640,
            addons: [
              { name: "Овсяное молоко с ванильным сиропом", quantity: 1 },
            ],
          },
        ],
      },
    ],
  },
};
