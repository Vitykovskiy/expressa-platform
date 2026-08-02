import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { shallowRef } from "vue";

import PhoneAuthPage from "../../components/compositions/PhoneAuthPage.vue";

const meta = {
  title: "Compositions/PhoneAuthPage",
  component: PhoneAuthPage,
} satisfies Meta<typeof PhoneAuthPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  parameters: { viewport: { defaultViewport: "mobile320" } },
  render: () => ({
    components: { PhoneAuthPage },
    setup() {
      const submitted = shallowRef("");
      return { submitted };
    },
    template: `<PhoneAuthPage @submit="submitted = $event" /><p v-if="submitted" role="status">Код запрошен для {{ submitted }}</p>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Телефон" });
    await userEvent.click(input);
    await expect(input).toHaveFocus();
    await expect(
      canvas.getByRole("button", { name: "Получить код" }),
    ).toBeDisabled();
    await userEvent.type(input, "+7 999 123-45-67");
    await userEvent.click(canvas.getByRole("button", { name: "Получить код" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Код запрошен");
  },
};
export const Error: Story = {
  args: { error: "Введите номер в формате +7 999 123-45-67" },
  parameters: { viewport: { defaultViewport: "mobile390" } },
};
export const Loading: Story = {
  args: { loading: true },
  parameters: { viewport: { defaultViewport: "tablet768" } },
};
