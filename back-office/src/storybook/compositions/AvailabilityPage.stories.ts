import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import AvailabilityPage from "../../components/compositions/AvailabilityPage.vue";

const groups = [
  {
    title: "Кофе",
    items: [
      {
        id: "latte",
        type: "product" as const,
        name: "Латте",
        available: true,
        lastChange: { author: "Мария", at: "10:00" },
      },
      { id: "s", type: "size" as const, name: "Размер S", available: true },
      {
        id: "milk",
        type: "modifier" as const,
        name: "Овсяное молоко",
        available: false,
      },
    ],
  },
];
const save = async () => ({ author: "Иван", at: "10:05" });
const meta = {
  title: "Compositions/AvailabilityPage",
  component: AvailabilityPage,
  parameters: { viewport: { defaultViewport: "width1280" } },
} satisfies Meta<typeof AvailabilityPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Working: Story = {
  parameters: { viewport: { defaultViewport: "tablet768" } },
  args: {
    groups,
    intakeEnabled: true,
    saveAvailability: save,
    saveIntake: save,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(
      canvas.getByRole("textbox", { name: "Поиск доступности" }),
    ).toHaveFocus();
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Поиск доступности" }),
      "Латте",
    );
    await expect(canvas.queryByText("Размер S")).toBeNull();
    const toggle = canvas.getAllByRole("checkbox", { name: "Доступно" })[0];
    await userEvent.click(toggle);
    await expect(toggle).not.toBeChecked();
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(
      canvasElement.clientWidth,
    );
  },
};
export const Rollback: Story = {
  args: {
    groups,
    intakeEnabled: true,
    saveAvailability: async () => Promise.reject("save"),
    saveIntake: async () => Promise.reject("save"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getAllByRole("checkbox", { name: "Доступно" })[0];
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
    await expect(
      canvas.getByText("Не удалось сохранить доступность"),
    ).toBeVisible();
    const intake = canvas.getByRole("checkbox", {
      name: "Принимать новые заказы",
    });
    await userEvent.click(intake);
    await expect(intake).toBeChecked();
    await expect(
      canvas.getByText("Не удалось изменить приём заказов"),
    ).toBeVisible();
  },
};
export const Loading: Story = {
  args: {
    groups,
    intakeEnabled: true,
    saveAvailability: save,
    saveIntake: save,
    loading: true,
  },
};
export const Empty: Story = {
  parameters: { viewport: { defaultViewport: "workspace" } },
  args: {
    groups: [],
    intakeEnabled: false,
    saveAvailability: save,
    saveIntake: save,
  },
};
export const Error: Story = {
  parameters: { viewport: { defaultViewport: "wide" } },
  args: {
    groups,
    intakeEnabled: true,
    saveAvailability: save,
    saveIntake: save,
    error: "Нет соединения",
  },
};
