import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import AdminButton from "../../../admin/shared/ui/admin-button/AdminButton.vue";
import EmptyState from "../../../admin/shared/ui/empty-state/EmptyState.vue";
import StatusBadge from "../../../admin/shared/ui/status-badge/StatusBadge.vue";

const meta = {
  title: "Admin/Shared/Display",
  component: AdminButton,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "destructive", "ghost"],
    },
    disabled: { control: "boolean" },
    type: { control: "select", options: ["button", "submit", "reset"] },
    onClick: { action: "click" },
  },
} satisfies Meta<typeof AdminButton>;

export default meta;

type Story = StoryObj<typeof meta>;

function expectWithinHorizontalBounds(
  element: HTMLElement,
  container: HTMLElement,
) {
  const elementBounds = element.getBoundingClientRect();
  const containerBounds = container.getBoundingClientRect();

  expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
  expect(elementBounds.left).toBeGreaterThanOrEqual(containerBounds.left);
  expect(elementBounds.right).toBeLessThanOrEqual(containerBounds.right);
}

export const ButtonDefault: Story = {
  render: (args) => ({
    components: { AdminButton },
    setup: () => ({ args }),
    template: '<AdminButton v-bind="args">Сохранить</AdminButton>',
  }),
  args: {
    onClick: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Сохранить" });

    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const ButtonDisabled: Story = {
  render: () => ({
    components: { AdminButton },
    template: "<AdminButton disabled>Сохранить</AdminButton>",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("button", { name: "Сохранить" }),
    ).toBeDisabled();
  },
};

export const OrderStatuses: Story = {
  parameters: {
    layout: "fullscreen",
  },
  render: () => ({
    components: { StatusBadge },
    template: `
      <div
        data-testid="status-list"
        style="display: flex; width: 100%; max-width: 100%; flex-wrap: wrap; justify-content: center; gap: 8px"
      >
        <StatusBadge status="Created" />
        <StatusBadge status="Confirmed" />
        <StatusBadge status="Ready for pickup" />
        <StatusBadge status="Rejected" />
        <StatusBadge status="Closed" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const statusList = canvas.getByTestId("status-list");

    await expect(canvas.getByText("Новый")).toBeVisible();
    await expect(canvas.getByText("Подтверждён")).toBeVisible();
    await expect(canvas.getByText("Готов")).toBeVisible();
    await expect(canvas.getByText("Отклонён")).toBeVisible();
    await expect(canvas.getByText("Закрыт")).toBeVisible();
    expectWithinHorizontalBounds(statusList, canvasElement);
  },
};

export const Empty: Story = {
  render: () => ({
    components: { EmptyState },
    template: `
      <EmptyState
        title="Заказов пока нет"
        description="Новые заказы появятся в этом разделе."
      />
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Заказов пока нет",
    );
  },
};

export const EmptyWithLongText: Story = {
  parameters: {
    layout: "fullscreen",
  },
  render: () => ({
    components: { EmptyState },
    template: `
      <div
        data-testid="long-empty-state"
        style="width: 320px; max-width: 100%"
      >
        <EmptyState
          title="Заказы с очень длинным названием раздела пока отсутствуют"
          description="Когда появятся новые заказы, они будут показаны здесь без обрезания важного описания."
        />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const wrapper = canvas.getByTestId("long-empty-state");
    const emptyState = canvas.getByRole("status");

    await expect(
      canvas.getByText(
        "Заказы с очень длинным названием раздела пока отсутствуют",
      ),
    ).toBeVisible();
    expectWithinHorizontalBounds(wrapper, canvasElement);
    expectWithinHorizontalBounds(emptyState, wrapper);
  },
};
