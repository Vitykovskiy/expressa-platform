import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { createAuthFixtures } from "../fixtures";
import AuthScreen from "../../../admin/pages/auth/AuthScreen.vue";

const meta = {
  title: "Admin/Auth/AuthScreen",
  component: AuthScreen,
  argTypes: {
    login: {
      control: false,
      description:
        "Синхронно возвращает результат входа для введённого телефона.",
    },
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AuthScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
const phone = "+7 900 123-45-67";
const login = createAuthFixtures().login;

export const PhoneValidation: Story = {
  args: { login },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Телефон");
    await expect(input).toHaveFocus();
    await userEvent.type(input, "+7 900");
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAttribute("aria-describedby", "auth-phone-error");
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "Введите корректный номер телефона",
    );
  },
};
export const OtpValidation: Story = {
  args: { login },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const phoneInput = canvas.getByLabelText("Телефон");
    await userEvent.click(phoneInput);
    await userEvent.type(phoneInput, phone);
    await userEvent.keyboard("{Enter}");
    const otp = await canvas.findByLabelText("Код из сообщения");
    await expect(otp).toHaveFocus();
    await userEvent.type(otp, "12");
    await userEvent.keyboard("{Enter}");
    await expect(otp).toHaveAttribute("aria-invalid", "true");
    await expect(otp).toHaveAttribute("aria-describedby", "auth-otp-error");
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "Введите код из сообщения",
    );
    await userEvent.clear(otp);
    await userEvent.type(otp, "9999");
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "Код неверный или истёк",
    );
  },
};
export const Denied: Story = {
  args: { login: () => "no_role" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const phoneInput = canvas.getByLabelText("Телефон");
    await userEvent.click(phoneInput);
    await userEvent.type(phoneInput, phone);
    await userEvent.keyboard("{Enter}");
    const otp = await canvas.findByLabelText("Код из сообщения");
    await userEvent.click(otp);
    await userEvent.type(otp, "1234");
    await userEvent.keyboard("{Enter}");
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Доступ запрещён",
    );
  },
};
export const Success: Story = {
  args: { login },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const phoneInput = canvas.getByLabelText("Телефон");
    await userEvent.click(phoneInput);
    await userEvent.type(phoneInput, phone);
    await userEvent.keyboard("{Enter}");
    const otp = await canvas.findByLabelText("Код из сообщения");
    await userEvent.click(otp);
    await userEvent.type(otp, "1234");
    await userEvent.keyboard("{Enter}");
    await expect(await canvas.findByText("Вход выполнен")).toBeVisible();
  },
};
