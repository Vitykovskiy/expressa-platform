import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, shallowRef } from "vue";
import { createNavigationItems } from "../../../src/app/navigation";
import OrdersScreen from "../../../src/pages/admin/orders/OrdersScreen.vue";
import AdminShell from "../../../src/widgets/admin-shell/AdminShell.vue";
import { order, orderDetails } from "../../fixtures/catalog";

const items = createNavigationItems("administrator");
const meta = {
  title: "Экраны/Очередь заказов",
  id: "screens-queue",
  component: OrdersScreen,
  args: {
    orders: [
      order,
      {
        ...order,
        id: "order-43",
        number: "43",
        createdAt: "2026-09-21T10:40:00.000Z",
        total: 450,
        stage: "ACCEPTED",
      },
      {
        ...order,
        id: "order-44",
        number: "44",
        createdAt: "2026-09-21T10:50:00.000Z",
        total: 280,
        stage: "READY",
      },
    ],
    search: "",
    stage: "ALL",
    status: "ready",
    selectedOrderId: null,
    details: null,
    detailsLoading: false,
    transitionLoading: false,
    requiresTransitionRecovery: false,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof OrdersScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { AdminShell, OrdersScreen },
    setup: () => {
      const search = shallowRef(args.search);
      const stage = shallowRef(args.stage);
      const selectedOrderId = shallowRef(args.selectedOrderId);
      const details = shallowRef(args.details);
      const visibleOrders = computed(() =>
        args.orders.filter(
          (order) =>
            (stage.value === "ALL" || order.stage === stage.value) &&
            order.number.includes(search.value.trim()),
        ),
      );
      function open(orderId: string): void {
        selectedOrderId.value =
          selectedOrderId.value === orderId ? null : orderId;
        const selectedOrder = args.orders.find(
          (candidate) => candidate.id === selectedOrderId.value,
        );
        details.value = selectedOrder
          ? {
              ...orderDetails,
              ...selectedOrder,
              snapshot: orderDetails.snapshot.map((item) => ({
                ...item,
                quantity: 1,
                unitTotal: selectedOrder.total,
                lineTotal: selectedOrder.total,
              })),
            }
          : null;
      }
      return {
        args,
        items,
        search,
        stage,
        selectedOrderId,
        details,
        visibleOrders,
        open,
      };
    },
    template: `<AdminShell role="administrator" active-section="orders" :items="items">
      <OrdersScreen v-bind="args" :orders="visibleOrders" :search="search" :stage="stage" :selected-order-id="selectedOrderId" :details="details"
        @update:search="search = $event" @update:stage="stage = $event"
        @open="open" />
    </AdminShell>`,
  };
}
export const Ready: Story = {
  name: "Готово",
  render,
  globals: { viewport: "desktop" },
};
export const ReadyMobile: Story = {
  name: "Мобильный вид",
  render,
  globals: { viewport: "mobile" },
};
export const SelectedDetails: Story = {
  name: "Открытые детали",
  render,
  args: { selectedOrderId: order.id, details: orderDetails },
};
export const Loading: Story = {
  name: "Загрузка",
  render,
  args: { status: "loading", orders: [] },
};
export const Empty: Story = { name: "Пусто", render, args: { orders: [] } };
export const Unresolved: Story = {
  name: "Данные не подтверждены",
  render,
  args: { status: "unresolved", orders: [] },
};

export const DetailsLoading: Story = {
  name: "Загрузка деталей",
  render,
  args: { selectedOrderId: order.id, detailsLoading: true },
};
export const TransitionPending: Story = {
  name: "Изменение стадии",
  render,
  args: {
    selectedOrderId: order.id,
    details: orderDetails,
    transitionLoading: true,
  },
};
export const SearchEmpty: Story = {
  name: "Поиск без результатов",
  render,
  args: { orders: [], search: "123" },
};
export const StageEmpty: Story = {
  name: "Пустая стадия",
  render,
  args: { orders: [], stage: "READY" },
};
export const SearchAndStageEmpty: Story = {
  name: "Поиск и стадия без результатов",
  render,
  args: { orders: [], search: "123", stage: "READY" },
};

export const TransitionRecovery: Story = {
  name: "Сверка стадии",
  render,
  args: {
    selectedOrderId: order.id,
    details: orderDetails,
    requiresTransitionRecovery: true,
  },
};
export const LongDetails: Story = {
  name: "Длинный заказ и история",
  render,
  args: {
    orders: [
      {
        ...order,
        number: "123456789012345678901234567890",
        total: 1480,
        stage: "PREPARING",
      },
      { ...order, id: "order-43", number: "43", stage: "ACCEPTED" },
    ],
    selectedOrderId: order.id,
    details: {
      ...orderDetails,
      number: "123456789012345678901234567890",
      total: 1480,
      stage: "PREPARING",
      snapshot: [
        {
          ...orderDetails.snapshot[0],
          productName: "Капучино с двойной порцией эспрессо и овсяным молоком",
          quantity: 2,
          unitTotal: 440,
          lineTotal: 880,
          modifiers: [
            {
              modifierOptionId: "oat",
              modifierName: "Овсяное молоко",
              priceDelta: 60,
            },
            {
              modifierOptionId: "espresso",
              modifierName: "Дополнительный эспрессо",
              priceDelta: 85,
            },
          ],
        },
        {
          ...orderDetails.snapshot[0],
          productId: "tea",
          productName: "Чёрный чай с бергамотом",
          portionLabel: "Большой чайник 600 мл",
          quantity: 1,
          unitTotal: 300,
          lineTotal: 300,
        },
        {
          ...orderDetails.snapshot[0],
          productId: "croissant",
          productName: "Круассан с миндальным кремом и лепестками миндаля",
          portionLabel: null,
          quantity: 1,
          unitTotal: 300,
          lineTotal: 300,
        },
      ],
      events: [
        {
          from: "CREATED",
          to: "ACCEPTED",
          occurredAt: "2026-09-21T10:31:00.000Z",
          actorLabel: "Администратор Анна",
        },
        {
          from: "ACCEPTED",
          to: "PREPARING",
          occurredAt: "2026-09-21T10:33:00.000Z",
          actorLabel: "Бариста Александр Константинопольский",
        },
      ],
    },
  },
};
