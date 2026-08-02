import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { shallowRef } from "vue";

import OtpPage from "../../components/compositions/OtpPage.vue";

const meta = {
  title: "Compositions/OtpPage",
  component: OtpPage,
} satisfies Meta<typeof OtpPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  args: { phone: "+7 999 123-45-67" },
  parameters: { viewport: { defaultViewport: "mobile320" } },
  render: (storyArgs) => ({
    components: { OtpPage },
    setup() {
      const submitted = shallowRef("");
      return { storyArgs, submitted };
    },
    template: `<OtpPage v-bind="storyArgs" @submit="submitted = $event" /><p v-if="submitted" role="status">Код подтверждён</p>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("textbox", { name: "Цифра 1" }));
    await expect(
      canvas.getByRole("textbox", { name: "Цифра 1" }),
    ).toHaveFocus();
    await expect(
      canvas.getByRole("button", { name: "Подтвердить" }),
    ).toBeDisabled();
    for (let index = 1; index <= 6; index += 1) {
      await userEvent.type(
        canvas.getByRole("textbox", { name: `Цифра ${index}` }),
        String(index),
      );
    }
    await userEvent.click(canvas.getByRole("button", { name: "Подтвердить" }));
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Код подтверждён",
    );
  },
};
export const CodeError: Story = {
  args: {
    phone: "+7 999 123-45-67",
    error: "Код неверный или истёк. Запросите новый.",
  },
  parameters: { viewport: { defaultViewport: "mobile390" } },
};
export const Loading: Story = {
  args: { phone: "+7 999 123-45-67", loading: true },
  parameters: { viewport: { defaultViewport: "tablet768" } },
};
