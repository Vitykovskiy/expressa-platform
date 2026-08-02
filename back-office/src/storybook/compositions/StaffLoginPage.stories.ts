import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import StaffLoginPage from "../../components/compositions/StaffLoginPage.vue";

const meta = {
  title: "Compositions/StaffLoginPage",
  component: StaffLoginPage,
} satisfies Meta<typeof StaffLoginPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Barista: Story = {
  args: { role: "barista" },
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(
      canvas.getByRole("textbox", { name: "Номер телефона" }),
    ).toHaveFocus();
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Номер телефона" }),
      "+79991234567",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Получить код" }));
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Одноразовый код" }),
      "123456",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Войти" }));
    await expect(canvas.getByText(/Открыт раздел очередь/)).toBeVisible();
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(
      canvasElement.clientWidth,
    );
  },
};
export const Administrator: Story = {
  args: { role: "administrator" },
  parameters: { viewport: { defaultViewport: "workspace" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Номер телефона" }),
      "+79991234567",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Получить код" }));
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Одноразовый код" }),
      "123456",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Войти" }));
    await expect(
      canvas.getByText(/Открыт раздел администрирование/),
    ).toBeVisible();
  },
};
export const InvalidPhone: Story = {
  args: { role: "barista" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Номер телефона" }),
      "79991234567",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Получить код" }));
    await expect(
      canvas.getByText("Введите российский номер в формате +7"),
    ).toBeInTheDocument();
  },
};
export const Waiting: Story = {
  args: { role: "barista", waiting: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Получить код Загрузка" }),
    ).toBeDisabled();
  },
};
export const AccessDenied: Story = {
  args: { role: "customer" },
  parameters: { viewport: { defaultViewport: "wide" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Номер телефона" }),
      "+79991234567",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Получить код" }));
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Одноразовый код" }),
      "123456",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Войти" }));
    await expect(canvas.getByText("ACCESS_DENIED")).toBeInTheDocument();
  },
};
