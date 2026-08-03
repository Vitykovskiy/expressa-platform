import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import type {
  Order,
  OrderActionEvent,
} from "../../../admin/shared/ui/Admin.types";
import OrdersScreen from "../../../admin/pages/orders/OrdersScreen.vue";
import ConfirmDialog from "../../../admin/shared/ui/confirm-dialog/ConfirmDialog.vue";

const orders: Order[] = [
  {
    id: "1",
    orderNumber: "#1234",
    customerName: "Анна Смирнова",
    items: "Капучино M, Круассан",
    total: 380,
    status: "Created",
    slotTime: "10:00",
    createdAt: new Date("2026-07-27T10:00:00"),
  },
  {
    id: "2",
    orderNumber: "#1235",
    customerName: "Дмитрий Иванов",
    items: "Латте L, Чизкейк",
    total: 450,
    status: "Confirmed",
    slotTime: "10:10",
    createdAt: new Date("2026-07-27T10:10:00"),
  },
  {
    id: "3",
    orderNumber: "#1236",
    customerName: "Елена Петрова",
    items: "Эспрессо, Круассан",
    total: 280,
    status: "Ready for pickup",
    slotTime: "10:20",
    createdAt: new Date("2026-07-27T10:20:00"),
  },
];

const meta = {
  title: "Admin/Orders/Screen",
  component: OrdersScreen,
  argTypes: {
    orders: {
      control: "object",
      description: "Заказы для отображения и фильтрации.",
    },
    onRefresh: {
      action: "refresh",
      description: "Запрашивает обновление списка заказов.",
    },
    "onOrder-action": {
      action: "order-action",
      description: "Передаёт действие над заказом.",
    },
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof OrdersScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

function storyUser() {
  return userEvent.setup({ pointerEventsCheck: 0 });
}

function pageCanvas(canvasElement: HTMLElement) {
  return within(canvasElement.ownerDocument.body);
}

export const AllStatuses: Story = {
  args: {
    orders,
    onRefresh: fn(),
    "onOrder-action": fn<(event: OrderActionEvent) => void>(),
  },
};

export const FiltersAndRefresh: Story = {
  args: {
    orders,
    onRefresh: fn(),
    "onOrder-action": fn<(event: OrderActionEvent) => void>(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const page = pageCanvas(canvasElement);
    const user = storyUser();

    await user.click(canvas.getByRole("button", { name: "Новые" }));
    await expect(canvas.getByText("#1234")).toBeVisible();
    await expect(canvas.queryByText("#1235")).not.toBeInTheDocument();

    await user.click(canvas.getByRole("button", { name: "Подтверждённые" }));
    await expect(canvas.getByText("#1235")).toBeVisible();
    await user.click(canvas.getByRole("button", { name: "Готовы" }));
    await expect(canvas.getByText("#1236")).toBeVisible();

    const refreshButton = canvas.getByRole("button", {
      name: "Обновить заказы",
    });
    await expect(refreshButton).toHaveAttribute("title", "Обновить заказы");
    await expect(refreshButton.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await user.click(refreshButton);
    await expect(args.onRefresh).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(page.getByText("Обновлено")).toBeVisible());
  },
};

export const StatusActions: Story = {
  args: {
    orders,
    onRefresh: fn(),
    "onOrder-action": fn<(event: OrderActionEvent) => void>(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const page = pageCanvas(canvasElement);
    const user = storyUser();

    await user.click(canvas.getByRole("button", { name: "Подтвердить" }));
    await expect(args["onOrder-action"]).toHaveBeenCalledWith({
      orderId: "1",
      action: "confirm",
    });
    await waitFor(() =>
      expect(page.getByText("Заказ подтверждён")).toBeVisible(),
    );

    await user.click(canvas.getByRole("button", { name: "Готово к выдаче" }));
    await expect(args["onOrder-action"]).toHaveBeenCalledWith({
      orderId: "2",
      action: "ready",
    });
    await waitFor(() =>
      expect(page.getByText("Заказ готов к выдаче")).toBeVisible(),
    );
  },
};

export const RejectDialog: Story = {
  args: {
    orders,
    onRefresh: fn(),
    "onOrder-action": fn<(event: OrderActionEvent) => void>(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const page = pageCanvas(canvasElement);
    const user = storyUser();

    await user.click(canvas.getByRole("button", { name: "Отклонить" }));
    const dialog = page.getByRole("dialog", { name: "Отклонить заказ" });
    await expect(dialog).toBeVisible();
    const dialogCanvas = within(dialog);
    await user.type(
      dialogCanvas.getByRole("textbox", { name: "Причина" }),
      "Клиент отменил заказ",
    );
    await user.click(dialogCanvas.getByRole("button", { name: "Отклонить" }));

    await expect(args["onOrder-action"]).toHaveBeenCalledWith({
      orderId: "1",
      action: "reject",
      reason: "Клиент отменил заказ",
    });
    await waitFor(() =>
      expect(
        page.getByText("Заказ отклонён: Клиент отменил заказ"),
      ).toBeVisible(),
    );
  },
};

export const RejectDialogVisual: Story = {
  args: {
    orders,
    onRefresh: fn(),
    "onOrder-action": fn<(event: OrderActionEvent) => void>(),
  },
  render: () => ({
    components: { ConfirmDialog },
    setup: () => ({ open: true }),
    template:
      '<ConfirmDialog v-model:open="open" confirm-label="Отклонить" confirm-variant="destructive" description="Укажите причину отклонения заказа" input-placeholder="Причина отклонения" require-input title="Отклонить заказ" />',
  }),
};

export const CloseDialogCancelAndConfirm: Story = {
  args: {
    orders,
    onRefresh: fn(),
    "onOrder-action": fn<(event: OrderActionEvent) => void>(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const page = pageCanvas(canvasElement);
    const user = storyUser();
    const closeButton = canvas.getByRole("button", { name: "Выдан" });

    await user.click(closeButton);
    const closeDialog = page.getByRole("dialog", { name: "Выдать заказ" });
    await user.click(
      within(closeDialog).getByRole("button", { name: "Отмена" }),
    );
    await waitFor(() =>
      expect(page.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await expect(closeButton).toHaveFocus();

    await user.click(closeButton);
    const reopenedCloseDialog = page.getByRole("dialog", {
      name: "Выдать заказ",
    });
    await user.click(
      within(reopenedCloseDialog).getByRole("button", { name: "Подтвердить" }),
    );
    await expect(args["onOrder-action"]).toHaveBeenCalledWith({
      orderId: "3",
      action: "close",
    });
    await waitFor(() => expect(page.getByText("Заказ выдан")).toBeVisible());
  },
};

export const Empty: Story = {
  args: {
    orders: [],
    onRefresh: fn(),
    "onOrder-action": fn<(event: OrderActionEvent) => void>(),
  },
};

export const LongContentNarrow: Story = {
  args: {
    orders: [
      {
        id: "long",
        orderNumber: "#12345678901234567890",
        customerName: "Александра Александровна Константинопольская",
        items: [
          {
            productName:
              "Большой капучино с очень длинным названием авторской кофейной смеси",
            size: "Большой",
            quantity: 2,
            addons: [
              {
                name: "Альтернативное овсяное молоко с дополнительной пеной",
                quantity: 1,
              },
              {
                name: "Двойная карамель с натуральной ванилью",
                quantity: 2,
              },
            ],
          },
          {
            productName: "Круассан с миндальным кремом и сезонными ягодами",
            quantity: 1,
            addons: [
              {
                name: "Дополнительная порция клубничного соуса",
                quantity: 1,
              },
            ],
          },
        ],
        total: 1280,
        status: "Created",
        slotTime: "10:30",
        createdAt: new Date("2026-07-27T10:30:00"),
      },
    ],
    onRefresh: fn(),
    "onOrder-action": fn<(event: OrderActionEvent) => void>(),
  },
  parameters: { viewport: { defaultViewport: "mobile1" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByRole("article");
    const productQuantities = [
      ...card.querySelectorAll(
        ".order-card__product-row .order-card__quantity",
      ),
    ].map((quantity) => quantity.textContent?.trim());
    const addonQuantities = [
      ...card.querySelectorAll(".order-card__addon .order-card__quantity"),
    ].map((quantity) => quantity.textContent?.trim());

    await expect(productQuantities).toEqual(["× 2", "× 1"]);
    await expect(addonQuantities).toEqual(["× 1", "× 2", "× 1"]);
  },
};
