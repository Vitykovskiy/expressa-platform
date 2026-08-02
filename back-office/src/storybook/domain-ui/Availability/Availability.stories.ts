import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import AvailabilityGroup from "../../../components/domain-ui/Availability/AvailabilityGroup.vue";
import OrderIntakeControl from "../../../components/domain-ui/Availability/OrderIntakeControl.vue";
const backOfficeViewports = Object.fromEntries(
  [479, 480, 767, 768, 1023, 1024, 1280, 1440].map((width) => [
    `width${width}`,
    {
      name: `${width} px`,
      styles: { width: `${width}px`, height: "900px" },
      type: width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop",
    },
  ]),
);
const meta = {
  title: "Availability/Canonical",
  component: AvailabilityGroup,
  parameters: {
    viewport: { defaultViewport: "width768", viewports: backOfficeViewports },
  },
} satisfies Meta<typeof AvailabilityGroup>;
export default meta;
type Story = StoryObj;
const items = [
  {
    id: "p",
    type: "product" as const,
    name: "Капучино",
    available: true,
    lastChange: { author: "Мария", at: "10:00" },
  },
  { id: "s", type: "size" as const, name: "Размер S", available: true },
  {
    id: "m",
    type: "modifier" as const,
    name: "Овсяное молоко",
    available: false,
  },
];
export const IndependentTogglesAndAudit: Story = {
  render: () => ({
    components: { AvailabilityGroup, OrderIntakeControl },
    setup: () => ({
      items,
      save: async () => ({ author: "Иван", at: "10:05" }),
      intakeSave: async () => ({ author: "Иван", at: "10:05" }),
    }),
    template: `<section><AvailabilityGroup title="Кофе" :items="items" :save="save"/><OrderIntakeControl :enabled="true" :save="intakeSave"/></section>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getAllByRole("checkbox", { name: "Доступно" })[0];
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(toggle).not.toBeChecked();
    await expect(canvas.getByText("Изменил(а): Иван, 10:05")).toBeVisible();
    const intake = canvas.getByRole("checkbox", {
      name: "Принимать новые заказы",
    });
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await expect(intake).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(intake).not.toBeChecked();
  },
};
export const OptimisticRollback: Story = {
  render: () => ({
    components: { AvailabilityGroup },
    setup: () => ({
      items: [
        {
          id: "fail",
          type: "product" as const,
          name: "Ошибка сохранения",
          available: true,
        },
      ],
      save: async () => Promise.reject(new Error("fail")),
    }),
    template: `<AvailabilityGroup title="Ошибка" :items="items" :save="save"/>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("checkbox", { name: "Доступно" });
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
    await expect(
      canvas.getByText("Не удалось сохранить доступность"),
    ).toBeVisible();
  },
};
