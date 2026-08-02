import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { ref } from "vue";
import EmptyState from "../../../components/domain-ui/Feedback/EmptyState.vue";
import ErrorState from "../../../components/domain-ui/Feedback/ErrorState.vue";
import FormErrors from "../../../components/domain-ui/Feedback/FormErrors.vue";
import NotificationPermission from "../../../components/domain-ui/Feedback/NotificationPermission.vue";
import Skeleton from "../../../components/domain-ui/Feedback/Skeleton.vue";
import Snackbar from "../../../components/domain-ui/Feedback/Snackbar.vue";
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
  title: "Feedback/Canonical",
  component: Skeleton,
  parameters: {
    viewport: { defaultViewport: "width1280", viewports: backOfficeViewports },
  },
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj;
export const LoadingErrorAndPermissions: Story = {
  render: () => ({
    components: {
      Skeleton,
      EmptyState,
      ErrorState,
      Snackbar,
      FormErrors,
      NotificationPermission,
    },
    setup() {
      const permission = ref<"default" | "granted" | "denied">("default");
      return { open: ref(true), retry: ref(false), permission };
    },
    template: `<section><Skeleton/><EmptyState title="Нет товаров" message="Добавьте первый товар" action-label="Добавить"/><ErrorState message="Сеть недоступна" @retry="retry=true"/><Snackbar v-model="open" message="Изменения сохранены"/><FormErrors :errors="{name:'Поле обязательно'}"/><NotificationPermission :permission="permission" @request="permission='granted'"/><NotificationPermission permission="denied"/></section>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Уведомления не настроены")).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Разрешить уведомления" }),
    );
    await expect(canvas.getByText("Уведомления разрешены")).toBeVisible();
    await expect(canvas.getByText("Уведомления запрещены")).toBeVisible();
    await userEvent.tab();
    await userEvent.tab();
    const retry = canvas.getByRole("button", { name: "Повторить" });
    await expect(retry).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("Сеть недоступна")).toBeVisible();
  },
};
