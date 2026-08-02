import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";

import ControlsSpecimen from "./ControlsSpecimen.vue";

const meta = {
  component: ControlsSpecimen,
  title: "Controls/Catalog",
} satisfies Meta<typeof ControlsSpecimen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const States: Story = { args: { mode: "states" } };
export const KeyboardFocus: Story = {
  args: { mode: "focus" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(
      canvas.getByRole("button", { name: "Продолжить" }),
    ).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Закрыть" })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("textbox", { name: "Имя" })).toHaveFocus();
  },
};
export const QuantityBoundaries: Story = {
  args: { mode: "quantity" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [decrease] = canvas.getAllByRole("button", {
      name: "Уменьшить количество",
    });
    const [increase] = canvas.getAllByRole("button", {
      name: "Увеличить количество",
    });
    await expect(decrease).toBeDisabled();
    await expect(canvas.getByText("Итого: 12499 ₽")).toBeVisible();
    await userEvent.click(increase);
    await userEvent.click(increase);
    await expect(canvas.getByText("Итого: 37497 ₽")).toBeVisible();
    await expect(increase).toBeDisabled();
  },
};
